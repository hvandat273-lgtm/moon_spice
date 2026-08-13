"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./hero.module.css";

/**
 * The hero product, lit in WebGL.
 *
 * Raw WebGL2, no library. This draws one textured quad twice — the product and
 * its reflection — which is not worth 150KB of three.js or even 20KB of OGL in
 * a project that otherwise ships zero animation dependencies.
 *
 * Rendering is ON DEMAND. There is no permanent `requestAnimationFrame` loop:
 * a frame is scheduled when the pointer moves, when the page scrolls, or while
 * the light is still easing toward its target, and scheduling stops entirely
 * when the stage leaves the viewport or the tab is hidden. An idle tab does no
 * GPU work at all, which is the same rule the CSS motion layer follows.
 *
 * The caller renders a static <Image> fallback and only mounts this when the
 * pointer is fine, motion is allowed and a WebGL2 context is actually
 * obtainable.
 */

const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
uniform float uFlip;
void main() {
  vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);

  // The canvas is twice the product's height: the product occupies the top
  // half and its reflection the bottom half. Drawing the quad across the full
  // clip volume would render the product at double size.
  //
  // Named "unit" and not "half": half is a reserved word in GLSL ES, and it
  // fails the whole shader silently, leaving the stage invisible with the
  // static fallback quietly covering for it.
  float unit = aPosition.y * 0.5 + 0.5;        // 0 at the foot, 1 at the top
  float y = uFlip > 0.5 ? -unit : unit;        // mirrored about the foot
  gl_Position = vec4(aPosition.x, y, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uAlbedo;
uniform sampler2D uNormal;
uniform vec2 uLight;      // light position in UV space
uniform float uFlip;      // 1.0 while drawing the reflection

void main() {
  vec4 albedo = texture(uAlbedo, vUv);
  if (albedo.a < 0.004) discard;

  // The map is stored 0..1; bring it back to a signed vector.
  vec3 normal = normalize(texture(uNormal, vUv).rgb * 2.0 - 1.0);

  // A point light a little way off the surface, so moving the pointer sweeps
  // the incidence angle rather than just sliding a bright blob.
  vec3 toLight = normalize(vec3(uLight - vUv, 0.55));
  float diffuse = max(dot(normal, toLight), 0.0);

  // Foil specular: the pouch is a reflective laminate, so the highlight is
  // tight and rides the brighter parts of the photograph.
  vec3 view = vec3(0.0, 0.0, 1.0);
  vec3 halfway = normalize(toLight + view);
  float luminance = dot(albedo.rgb, vec3(0.2126, 0.7152, 0.0722));
  // Gated high on luminance and kept tight: the pouch is kraft paper with a
  // foil laminate, and a wide, strong highlight turned the whole body gold
  // instead of catching only the sheen.
  float specular = pow(max(dot(normal, halfway), 0.0), 48.0) * smoothstep(0.62, 0.95, luminance);

  // A narrow swing around the photograph's own exposure. Anything wider and
  // the light stops reading as light and starts recolouring the product.
  vec3 lit = albedo.rgb * (0.82 + 0.28 * diffuse) + specular * 0.35;

  float alpha = albedo.a;
  if (uFlip > 0.5) {
    // Reflection: dimmer, and fading with distance from the contact point.
    // vUv.y is 1 at the foot of the pouch, which is where the two meet, so the
    // fade runs from there — inverting it would light the far end instead.
    float fade = pow(vUv.y, 1.7);
    lit *= 0.34;
    alpha *= fade * 0.8;
  }

  outColor = vec4(lit, alpha);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // Silent shader failure is the hardest kind of bug to find here: the stage
    // just never appears and the static fallback covers for it.
    console.error("[ProductStage] shader failed to compile:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function loadTexture(gl: WebGL2RenderingContext, image: HTMLImageElement) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.generateMipmap(gl.TEXTURE_2D);
  return texture;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export function ProductStage({
  albedoSrc,
  normalSrc,
  label,
}: {
  albedoSrc: string;
  normalSrc: string;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) {
      setFailed(true);
      return;
    }

    let disposed = false;
    let frame = 0;
    let visible = true;
    // Where the light is, and where it is heading. Easing between the two is
    // the only reason a frame is ever scheduled without an input event.
    const light = { x: 0.32, y: 0.22 };
    const target = { x: 0.32, y: 0.22 };

    const program = gl.createProgram();
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!program || !vertex || !fragment) {
      setFailed(true);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[ProductStage] program failed to link:", gl.getProgramInfoLog(program));
      setFailed(true);
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uLight = gl.getUniformLocation(program, "uLight");
    const uFlip = gl.getUniformLocation(program, "uFlip");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let textures: WebGLTexture[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(canvas.clientWidth * dpr);
      // Twice the height: the lower half holds the reflection.
      const height = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        return true;
      }
      return false;
    };

    const draw = () => {
      frame = 0;
      if (disposed || !visible) return;

      // Ease toward the pointer. Once the distance is imperceptible we stop
      // scheduling, which is what makes an idle stage cost nothing.
      const dx = target.x - light.x;
      const dy = target.y - light.y;
      light.x += dx * 0.12;
      light.y += dy * 0.12;
      const settling = Math.abs(dx) + Math.abs(dy) > 0.0008;

      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uLight, light.x, light.y);

      // Reflection first so the product composites over it.
      gl.uniform1f(uFlip, 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.uniform1f(uFlip, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (settling) schedule();
    };

    const schedule = () => {
      if (frame || disposed || !visible) return;
      frame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target.x = (event.clientX - rect.left) / rect.width;
      target.y = (event.clientY - rect.top) / rect.height;
      schedule();
    };

    const onPointerLeave = () => {
      target.x = 0.32;
      target.y = 0.22;
      schedule();
    };

    const onVisibility = () => {
      visible = !document.hidden && visible;
      if (!document.hidden) schedule();
    };

    // Only render while the stage is actually on screen.
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
      if (visible) schedule();
    });
    observer.observe(canvas);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    Promise.all([loadImage(albedoSrc), loadImage(normalSrc)])
      .then(([albedo, normal]) => {
        if (disposed) return;
        gl.activeTexture(gl.TEXTURE0);
        textures.push(loadTexture(gl, albedo) as WebGLTexture);
        gl.uniform1i(gl.getUniformLocation(program, "uAlbedo"), 0);
        gl.activeTexture(gl.TEXTURE1);
        textures.push(loadTexture(gl, normal) as WebGLTexture);
        gl.uniform1i(gl.getUniformLocation(program, "uNormal"), 1);
        canvas.dataset.ready = "true";
        schedule();
      })
      .catch((error) => {
        console.error("[ProductStage] texture load failed:", error);
        setFailed(true);
      });

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", onVisibility);
      textures.forEach((texture) => gl.deleteTexture(texture));
      textures = [];
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [albedoSrc, normalSrc]);

  // Returning null hands the slot back to the static image the parent renders
  // underneath, so a shader failure degrades instead of leaving a hole.
  if (failed) return null;

  return <canvas aria-label={label} className={styles.heroProductCanvas} ref={canvasRef} role="img" />;
}
