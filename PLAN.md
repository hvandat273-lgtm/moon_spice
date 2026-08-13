Hãy xây dựng một website thương mại điện tử hoàn chỉnh chuyên bán GIA VỊ, THỰC PHẨM KHÔ và các sản phẩm seasoning.

Website phải có giao diện cao cấp, hiện đại, responsive và có thể deploy trực tiếp lên Vercel.

====================================================
1. TECHNOLOGY STACK
====================================================

Sử dụng:

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- PostgreSQL
- Neon PostgreSQL
- Drizzle ORM
- @neondatabase/serverless với drizzle-orm/neon-serverless cho transaction
- Node.js runtime cho database, authentication, checkout và upload; không dùng Edge runtime cho các route này
- Next.js Route Handlers cho API; Server Actions chỉ dùng cho thao tác nội bộ phù hợp
- Zod cho validation phía server
- Server Components khi phù hợp
- Client Components chỉ khi cần interaction
- Lucide Icons

Website phải chạy được bằng:

npm install
npm run dev

và có thể deploy trực tiếp lên Vercel.

Không sử dụng:
- Java Spring Boot
- PHP
- MySQL local
- SQLite local
- Backend server riêng

====================================================
2. PHONG CÁCH THIẾT KẾ
====================================================

Ảnh người dùng cung cấp `ChatGPT Image 10_54_06 10 thg 8, 2026.png` kích thước
1122x1402 là visual reference chính cho storefront desktop. Chỉ tham chiếu bố cục,
nhịp khoảng trắng, bảng màu và art direction; không đưa nguyên bitmap lên website,
không sao chép logo MOOR SPICE, chữ Nhật, bao bì, ảnh món ăn, claim hoặc review trong
ảnh khi chưa có quyền sử dụng. Nếu ảnh không còn trong workspace, đặc tả hình học bên
dưới là source of truth và không được chặn implementation.

Phong cách:

Premium Japanese Food Ecommerce
+
Natural Italian Spice Brand

Tên thương hiệu của dự án: MOON SPICE.

Tạo bộ brand asset gốc, không sao chép logo MOOR SPICE:

- public/brand/logo.svg
- public/brand/logo-mark.svg
- app/icon.png hoặc app/icon.svg
- OpenGraph image 1200x630

Logo phải có text alternative "Moon Spice" và có phiên bản dùng được trên nền sáng/
tối.

Tone màu chính:

Background:
#F7F3EA
#FFFDF8

Olive Green:
#4B512B
#5F6535

Burgundy / Dark Red:
#8F201C

Text:
#2E2A24

Accent:
#B18A45

Border:
#DDD4C5

Muted text:
#625C52

#B18A45 chỉ dùng cho star/icon/đường trang trí hoặc chữ lớn đạt chuẩn tương phản; không
dùng làm body text, link hoặc trạng thái control trên nền sáng.

Phong cách tổng thể:

- tối giản
- premium
- natural
- botanical/natural-looking ở cấp độ mỹ thuật, không phải claim chứng nhận sản phẩm
- nhiều khoảng trắng
- hình ảnh sản phẩm lớn
- typography sang trọng
- card bo góc nhẹ
- animation nhẹ
- hover tinh tế
- không sử dụng quá nhiều gradient
- không làm giao diện giống dashboard SaaS ở phần khách hàng
- Có thể dùng botanical line-art SVG gốc ở mép section với opacity thấp, aria-hidden
  và ẩn trên màn hình nhỏ; không sao chép họa tiết từ ảnh tham khảo.

Font sử dụng:

Cormorant Garamond cho heading.

Inter cho nội dung. Phải load bằng next/font và có font fallback phù hợp.

Design tokens bắt buộc:

- Content container max-width 1280px.
- Gutter desktop clamp(24px, 5.8vw, 80px), tablet 32px, mobile 16–20px.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 80, 96px.
- Section gap: desktop 64–80px, tablet 48–64px, mobile 40–48px.
- Card radius 8–12px; button radius 4–6px; tránh pill/bo tròn kiểu SaaS.
- Card border 1px solid #DDD4C5; shadow mặc định tối đa
  0 8px 24px rgb(46 42 36 / 8%).
- Hero H1 clamp(2.5rem, 4.6vw, 4.75rem), line-height 0.98–1.05.
- Section title clamp(2rem, 3vw, 3.25rem).
- Body 16–18px, line-height 1.55–1.7.
- Eyebrow 11–13px, uppercase, letter-spacing 0.16–0.2em; không áp tracking lớn cho
  đoạn tiếng Việt dài.
- Chỉ load font weight Cormorant Garamond 400/500/600 và Inter 400/500/600 với
  display=swap.

====================================================
3. HEADER
====================================================

Header desktop:

[LOGO]

Logo điều hướng về /.

Sản phẩm
Gia vị
Combo
Công thức
Về chúng tôi
FAQ

                         Tìm kiếm
                         Giỏ hàng

Search mở ô tìm kiếm và điều hướng tới /products?q=<từ-khóa>.
Cart mở Cart Drawer; có link tới /cart.

Visual desktop bám ảnh tham khảo: header nền #FFFDF8 cao 76–80px, logo trái, navigation
căn giữa, cụm search/cart phải, khoảng cách thoáng và hairline 1px phía dưới. Icon button
có hit area tối thiểu 44x44px. Không render icon account vì MVP không có customer login;
không tạo dead button chỉ để giống ảnh.

Phía trên header có announcement bar:

"MIỄN PHÍ VẬN CHUYỂN CHO ĐƠN HÀNG TỪ {NGƯỠNG}"

Announcement bar nền olive đậm, chữ cream, cao 24–28px desktop. Nội dung và ngưỡng
phải lấy từ getShippingPolicy()/SiteSetting, format VND; không hard-code 500.000đ hoặc
¥4,000 từ ảnh tham khảo.

Header sticky khi scroll.

Cart icon phải hiển thị badge số lượng sản phẩm.

Mobile sử dụng hamburger menu. Từ 390px hiển thị hamburger + logo + search + cart;
dưới 390px chuyển search vào drawer để logo/cart không bị ép.

====================================================
4. HOMEPAGE / LANDING PAGE
====================================================

Route:

/

Thứ tự Homepage bắt buộc theo visual reference:

1. AnnouncementBar
2. StorefrontHeader
3. HeroProduct
4. UspStrip
5. EditorialTriptych gồm IngredientStory + UsageGrid + ReviewList
6. FeaturedPurchaseBanner
7. BestSellerGrid
8. CategoryGrid
9. Nội dung công thức/brand nếu có
10. Footer

Không đặt Best Seller/Category chen giữa USP và EditorialTriptych. Các mục 6–11 bên
dưới mô tả component/dữ liệu; thứ tự render tuân theo danh sách này.

Nhịp riêng cho cụm tham chiếu: Hero -> USP không có section gap; USP ->
EditorialTriptych 20–28px; EditorialTriptych -> FeaturedPurchaseBanner 16–24px. Gap
64–80px chỉ bắt đầu trước BestSeller/Category để toàn bộ banner vẫn nằm trong nhịp gần
ảnh 1122x1402.

Hero Product lấy từ SiteSetting.hero_product_id và database. Seed đặt Italian Herb
Spice làm hero mặc định. Luôn dùng resolveHomepageProduct("hero") và fallback
deterministic theo SiteSetting contract; không render button chết.

Hero phải giống phong cách ảnh tham khảo về bố cục, không dùng screenshot làm một ảnh
nền chứa sẵn text. Tên, giá, CTA, badge và claim đều phải là HTML có thể đọc/chọn/dịch.

Toàn bộ tên Product, shortDescription/description, ProductImage, alt và dữ liệu biến
thể trong hero phải render từ Product/Variant được chọn. Label CTA là UI copy tiếng
Việt; href, enabled/disabled state lấy từ Product/Variant. "Italian Herb Spice" chỉ là
dữ liệu seed, không được hard-code trong component.

Layout desktop >=1120px:

------------------------------------------------

TEXT 34%          PRODUCT PACKSHOT 32%    FOOD/LIFESTYLE SCENE 34%

GIA VỊ CHO
MỖI BỮA ĂN

{PRODUCT.NAME}

{PRODUCT.SHORT_DESCRIPTION}

[ MUA NGAY ]

------------------------------------------------

Product pouch phải là thành phần nổi bật nhất, dùng role=HERO_CUTOUT; nếu thiếu thì
dùng primary image trong khung cream, không cố xóa nền bằng CSS.

Hero full-bleed, cao clamp(500px, 45vw, 680px). Packshot nền trong rộng khoảng
300–410px, không crop nhãn, có thể overlap nhẹ giữa cột nhưng không che text/CTA.
Scene bên phải dùng object-fit: cover với focal point do admin chọn; phía text có cream
scrim/gradient nhẹ để luôn đạt tương phản. Mobile ưu tiên role=HERO_BACKGROUND_MOBILE,
fallback crop HERO_BACKGROUND theo focal point. Không kéo giãn gallery image thay scene.

Đồ họa/ảnh phụ xung quanh chỉ lấy từ ProductImage đã được admin gắn cho hero hoặc asset
trang trí trung tính; không suy đoán thành phần từ Product khác.

Background kiểu food photography premium: ánh sáng ấm tự nhiên, beige/olive, shallow
depth of field, bề mặt gỗ/đá và styling thảo mộc tinh tế. Không để bất kỳ chữ, giá hoặc
claim nào baked vào bitmap.

Badge tròn bên phải là optional HTML/CSS, đường kính clamp(120px, 12vw, 168px). Trong
MVP chỉ dùng dấu hiệu thương hiệu trung tính "MOON SPICE"/năm thành lập đã xác minh
hoặc ẩn badge; chưa có ProductClaim model nên không render claim sản phẩm trong badge.
Tuyệt đối không sao chép claim trong ảnh.

Hero CTA:

MUA NGAY
XEM SẢN PHẨM

MUA NGAY điều hướng tới Product Detail của sản phẩm hero. Không thêm thẳng vào cart
khi người dùng chưa chọn variant.

XEM SẢN PHẨM điều hướng tới /products.

CTA chính burgundy rộng khoảng 240–280px, cao tối thiểu 48px. CTA phụ là text link có
mũi tên và focus state rõ ràng; không tạo hai nút cùng độ nhấn.

====================================================
5. USP SECTION
====================================================

Ngay dưới hero hiển thị 4 lợi ích trung tính mặc định:

- Hương vị hài hòa
- Phù hợp nhiều món
- Phối trộn tiện lợi
- Hướng dẫn rõ ràng

Mỗi item:

Lucide/custom line SVG gốc, không dùng emoji
title
description

Desktop là strip 4 cột bằng nhau, padding dọc 28–36px; icon line nằm trong vòng tròn
52–56px và các item ngăn bằng hairline dọc như ảnh. Tablet/mobile chuyển 2x2; dưới
390px chuyển 1 cột, icon trái và text phải. Không dùng horizontal marquee.

USP mặc định chỉ dùng copy trải nghiệm trung tính. Mọi claim về thành phần, nguồn gốc,
"tự nhiên", "organic", chất tạo màu hoặc lợi ích sức khỏe phải lấy từ dữ liệu đã được
admin xác minh nguồn theo mục 51; không hard-code vào giao diện.

====================================================
6. HOMEPAGE EDITORIAL TRIPTYCH
====================================================

Ngay sau USP là một cụm `EditorialTriptych` trong cùng container, bám bố cục ảnh:

- Desktop >=1120px: grid 1fr 1fr 1.05fr, gap 20–24px, ba card cao cân bằng.
- Tablet: hai cột; ReviewList chiếm trọn hàng dưới.
- Mobile: một cột theo DOM order IngredientStory -> UsageGrid -> ReviewList.
- Card nền #FFFDF8, border 1px #DDD4C5, radius 8–10px, padding 20–24px; không shadow nặng.

Ba card là component/dữ liệu riêng nhưng phải tạo thành một cụm thị giác thống nhất,
không render thành ba section full-width cách xa nhau.

====================================================
7. INGREDIENT STORY CARD
====================================================

Heading tiếng Việt: "THÀNH PHẦN". Có thể dùng eyebrow tiếng Anh ngắn "INGREDIENTS"
như chi tiết trang trí, nhưng tiếng Việt là nội dung chính.

Card lấy Product.ingredients và ProductImage role=INGREDIENT_SHOWCASE của Product
featured. Ảnh aspect-ratio 4/3, object-fit cover; dưới ảnh là excerpt thành phần và
text-link "XEM CHI TIẾT" tới Product Detail.

Không hard-code garlic/basil/... và không tự thêm từ "tự nhiên". Nếu thiếu ảnh role
phù hợp, dùng primary image trong khung cream; không lấy ảnh Product khác.

====================================================
8. USAGE GRID CARD
====================================================

Heading: "GỢI Ý CÁCH SỬ DỤNG".

Render tối đa 4 ProductUsageSuggestion active của Product featured thành lưới 2x2.
Mỗi tile có ảnh, title/caption luôn hiển thị trên dải olive ở cạnh dưới; thông tin
không được chỉ xuất hiện khi hover. Ảnh aspect-ratio 4/3 hoặc 1/1 nhất quán trong card.

Tại 390/430px vẫn giữ hai cột; ở 320px cho phép một cột nếu caption dài. Nếu không có
suggestion, hiển thị Product.usage dạng text có chủ đích, không tạo tile giả.

====================================================
9. REVIEW LIST CARD
====================================================

Heading: "KHÁCH HÀNG NÓI GÌ".

Hiển thị tối đa 3 Review approved của Product featured, mỗi review gồm
{rating, content, customerName, reviewedAt ?? createdAt}; phân cách bằng hairline. Rating có star
visual và text thay thế cho screen reader. Không hard-code nội dung/tên khách, không
hiển thị review DEMO ở Production và không tạo review giả khi danh sách rỗng.

Card có text-link "XEM THÊM ĐÁNH GIÁ" tới Product Detail khi còn review; empty state
trung tính khi chưa có review.

====================================================
10. FEATURED PURCHASE BANNER
====================================================

Sau EditorialTriptych là banner mua hàng full-width bên trong container, nền olive
đậm, radius 10–12px, overflow hidden. Desktop cao khoảng 300–340px, chia vùng copy
45% bên trái và packshot/lifestyle 55% giữa-phải như ảnh; không dùng bố cục ảnh trái,
nội dung phải của plan cũ.

Product lấy từ SiteSetting.featured_product_id; seed dùng Italian Herb Spice nhưng
component render hoàn toàn từ database. EditorialTriptych và banner dùng cùng kết quả
resolveHomepageProduct("featured") để không lệch Product; invalid thì fallback/ẩn cả cụm
theo SiteSetting contract, không resolve riêng từng card.

Vùng copy gồm eyebrow trung tính, Product.name, shortDescription, selector các
ProductVariant active, giá/originalPrice/SKU/stock của variant đang chọn, quantity và
CTA "THÊM VÀO GIỎ". Variant đầu tiên còn hàng được chọn hiển thị rõ; đổi variant phải
cập nhật toàn bộ dữ liệu. Không có variant còn hàng thì CTA "HẾT HÀNG" disabled.

Packshot dùng ProductImage role=HERO_CUTOUT hoặc primary fallback; lifestyle bên phải
dùng role=FEATURED_BACKGROUND và mobile ưu tiên FEATURED_BACKGROUND_MOBILE; không tái
dùng scene sáng của hero làm nền banner olive. Thiếu featured scene thì dùng nền olive
thuần + packshot, không kéo HERO_BACKGROUND vào. Badge vận chuyển là HTML/CSS và lấy
ngưỡng động từ getShippingPolicy(), không baked vào ảnh. MUA NGAY nếu được hiển thị
phải dùng variant đã chọn, thêm cart rồi điều hướng /checkout.

====================================================
11. LOWER HOMEPAGE COMMERCE SECTIONS
====================================================

Sau FeaturedPurchaseBanner mới render:

1. BestSellerGrid với heading "SẢN PHẨM ĐƯỢC YÊU THÍCH".
2. CategoryGrid có id="categories".

BestSeller lấy Product active có bestSeller=true, giới hạn theo
SiteSetting.homepage_best_seller_limit. Product card gồm ảnh, tên, category, khoảng
khối lượng, giá và rating approved. Nhiều variant hiển thị "Từ <giá thấp nhất>"; nút
THÊM VÀO GIỎ mở quick-select, không tự chọn ngầm. Hết stock thì disabled.

BestSeller grid: desktop 4, tablet 2, mobile từ 390px 2, dưới 390px 1. Hover chỉ zoom
ảnh tối đa 1.03 và tăng shadow nhẹ trong 180–220ms; CTA luôn nhìn thấy, không phụ thuộc hover.

CategoryGrid chỉ hiển thị Category active theo sortOrder, dùng imageUrl/imageAlt và đi
tới canonical /categories/<slug>. Dữ liệu seed có thể gồm Gia vị Ý, BBQ, thịt, hải sản,
rau củ, muối, tiêu, ớt, herbs và combo; không hard-code danh sách ở frontend.

====================================================
12. PRODUCT LIST
====================================================

Route:

/products

Có:

Search

Filter category

Filter price

Sort:

Mới nhất
Giá thấp → cao
Giá cao → thấp
Bán chạy

Grid sản phẩm.

Chỉ trả Product active có ít nhất một ProductVariant active. Có no-results state,
reset filter và pagination phía server.

URL contract:

/products?q=&category=&minPrice=&maxPrice=&sort=&page=

sort nhận một trong: newest, price_asc, price_desc, sales.

Filter/sort theo giá thấp nhất của các variant active. Sort sales dựa trên tổng
quantity của OrderItem thuộc Order COMPLETED, không dựa vào cờ bestSeller.

Filter và pagination phải nằm trong URL để Back/Forward, refresh và chia sẻ link
hoạt động đúng. Page size mặc định 12, tối đa 48.

====================================================
13. PRODUCT DETAIL
====================================================

Route:

/products/[slug]

Layout:

gallery ảnh

Gallery chính chỉ lấy ProductImage role=GALLERY và có thể thêm HERO_CUTOUT; không trộn
HERO_BACKGROUND, HERO_BACKGROUND_MOBILE, FEATURED_BACKGROUND,
FEATURED_BACKGROUND_MOBILE, INGREDIENT_SHOWCASE hoặc USAGE vào carousel. Các role nội
dung được render đúng section tương ứng bên dưới.

+

product information

Tên
Giá
Rating
Stock
Description
Ingredients
Weight

Quantity selector.

Button:

THÊM VÀO GIỎ

MUA NGAY

Bên dưới:

Mô tả
Thành phần
Hướng dẫn sử dụng
Bảo quản
Review
Sản phẩm liên quan

Bảo quản lấy từ Product.storageInstructions.

====================================================
14. SHOPPING CART
====================================================

USER KHÔNG CẦN LOGIN.

Không xây chức năng đăng ký/login cho khách hàng.

Giỏ hàng lưu bằng localStorage.

Cart object ví dụ:

{
 productId,
 variantId,
 sku,
 name,
 image,
 price,
 quantity,
 weight
}

Khóa duy nhất của một cart item là variantId. productId, name, image, price, SKU và
weight chỉ là dữ liệu hiển thị/cache; backend tự suy ra Product từ variantId.

Giá trong localStorage chỉ dùng để hiển thị tạm thời. Backend tuyệt đối không dùng
giá này để tạo đơn hàng.

Cart phải tồn tại sau khi refresh browser.

Khi mở Cart hoặc Checkout, frontend phải gọi API reconcile chỉ với danh sách
{ variantId, quantity } để lấy lại tên, ảnh, giá, trạng thái và stock hiện tại.

Nếu giá thay đổi, phải hiển thị giá cũ/gía mới và yêu cầu khách xác nhận. Nếu variant
inactive, bị xóa mềm hoặc hết hàng, đánh dấu đúng item, giới hạn lại quantity và
không cho đặt hàng cho tới khi cart hợp lệ.

Có Cart Drawer khi bấm icon giỏ hàng.

Route riêng:

/cart

Hiển thị:

Ảnh
Tên
Giá
Số lượng
Thành tiền

[-] 2 [+]

Xóa

Subtotal

Shipping

Total

[ TIẾN HÀNH ĐẶT HÀNG ]

====================================================
15. CHECKOUT
====================================================

Route:

/checkout

KHÔNG YÊU CẦU LOGIN.

Form:

Họ và tên *
Số điện thoại *
Email
Tỉnh/Thành phố *
Phường/Xã/Đặc khu *
Quận/Huyện cũ (không bắt buộc, chỉ dùng cho dữ liệu legacy hoặc đơn vị vận chuyển)
Số nhà, tên đường/thôn/xóm *
Ghi chú

Dropdown địa chỉ dùng bộ dữ liệu đơn vị hành chính Việt Nam 2 cấp được version hóa
trong project và có nguồn cập nhật rõ ràng. Lưu đồng thời code + label tại thời điểm
đặt hàng để lịch sử đơn không bị đổi khi danh mục địa giới cập nhật.

File mặc định: data/vn-administrative-units.json, kèm sourceUrl, publishedAt,
checksum và version. Order lưu addressDataVersion.

Payment:

● COD - Thanh toán khi nhận hàng

Có thể để kiến trúc mở rộng cho:

VNPay
MoMo

sau này.

Không hiển thị VNPay/MoMo ở phiên bản đầu. Trước khi bật phải bổ sung PaymentAttempt,
provider transaction ID, webhook signature verification, webhook idempotency và
reconciliation; không chỉ thêm button frontend.

Bên phải desktop hiển thị:

TÓM TẮT ĐƠN HÀNG

Product x quantity

Subtotal
Shipping
Total

[ ĐẶT HÀNG ]

Khi đặt hàng:

KHÔNG tin giá gửi từ frontend.

Backend phải lấy lại giá hiện tại của từng sản phẩm từ database và tự tính lại:

subtotal
shipping
total

để tránh sửa giá bằng DevTools.

Payload checkout chỉ được nhận:

{
 idempotencyKey,
 quoteHash,
 customer,
 items: [{ variantId, quantity }],
 paymentMethod: "COD"
}

Không nhận productId, SKU, tên sản phẩm, giá, subtotal, shipping hoặc total làm nguồn
tin cậy. Backend reject unknown fields, tối đa 50 dòng cart, quantity mỗi dòng từ 1
đến 99, gộp variantId trùng trước khi validate.

Client tạo idempotencyKey ngẫu nhiên cho mỗi lần checkout và giữ key trong
sessionStorage khi timeout/retry. Chỉ tạo key mới khi cart hoặc thông tin checkout
thay đổi.

Backend giữ phone bản hiển thị và tạo phoneNormalized dạng E.164 (+84 cho số Việt
Nam) sau khi loại khoảng trắng/dấu phân cách. Email trim + lowercase. Admin search và
Customer aggregation dùng phoneNormalized.

====================================================
16. ORDER
====================================================

Database Order:

id
orderCode
idempotencyKeyHash
requestFingerprint

customerName
phone
phoneNormalized
email

provinceCode
provinceName
wardCode
wardName
legacyDistrictName nullable
addressLine
addressDataVersion

note

subtotal
shippingFee
total

paymentMethod
paymentStatus
paymentProviderTransactionId nullable
paidAt nullable

status
finalizedAt nullable
reservationExpiresAt
inventoryRestoredAt nullable
returnDisposition nullable

createdAt
updatedAt

orderCode và idempotencyKeyHash phải unique.

PaymentMethod phiên bản đầu chỉ có COD.

PaymentStatus:

UNPAID
PAID
FAILED
REFUNDED

OrderStatus:

PENDING
CONFIRMED
PREPARING
SHIPPING
DELIVERY_FAILED
RETURNED
COMPLETED
CANCELLED

====================================================
17. ORDER ITEM
====================================================

OrderItem:

id
orderId
productId
productVariantId

productName
productImageUrl nullable sau thời hạn lưu asset
variantSku
weightLabel

unitPrice
quantity
lineSubtotal

Backend chỉ nhận variantId rồi tự suy ra productId. Lưu snapshot tên sản phẩm, URL
ảnh, SKU biến thể, khối lượng và giá tại thời điểm đặt hàng.

Unique (orderId, productVariantId).

====================================================
18. ORDER SUCCESS
====================================================

Sau khi đặt thành công:

/order-success/[orderCode]

Route này không được công khai dữ liệu đơn hàng chỉ dựa trên orderCode.

Sau checkout thành công, backend phải cấp cookie chứa token HMAC-SHA-256 ký bằng
ORDER_ACCESS_SECRET. Payload không chứa PII và có dạng
{ grants: [{ orderId, orderCode, expiresAt }], issuedAt, nonce }. Khi tạo/replay một
đơn, server verify cookie cũ, loại grant hết hạn, upsert grant mới rồi chỉ giữ tối đa
5 đơn gần nhất để cookie không tăng vô hạn. Production dùng tên
__Host-moon_spice_order_access; local development dùng moon_spice_order_access.

Cookie:

- httpOnly
- secure production
- sameSite=lax
- path=/
- không đặt Domain
- TTL 30 phút

Mỗi grant có TTL 30 phút. Idempotent replay của checkout phải cấp lại cookie này.

Trang order success chỉ hiển thị đầy đủ dữ liệu khi token hợp lệ và tồn tại grant có
orderId + orderCode khớp route/Order. Response phải dynamic, Cache-Control: private,
no-store và noindex. Đặt hai đơn liên tiếp không được làm mất quyền xem đơn thứ nhất
trong thời hạn 30 phút, trừ khi đã vượt giới hạn 5 grant.

Truy cập trực tiếp không có quyền trả về màn hình chung, không tiết lộ đơn có tồn
tại hay không, và điều hướng tới /track-order.

/track-order nhận orderCode + số điện thoại đầy đủ, dùng response đồng nhất và rate
limit. Route này chỉ trả mã đơn, trạng thái, tổng tiền và mốc thời gian; không trả
email hoặc địa chỉ. Muốn xem đầy đủ phải có order-access token hợp lệ.

Hiển thị:

✓ ĐẶT HÀNG THÀNH CÔNG

Mã đơn:

MSP-20260810-0001

Thông tin khách hàng.

Danh sách sản phẩm.

Tổng tiền.

Trạng thái:

Chờ xác nhận.

Hiển thị thêm thời gian xác nhận dự kiến, thời gian giao dự kiến, link /track-order
và thông tin liên hệ lấy từ SiteSetting. Không thông báo "đã gửi email/SMS" nếu chưa
cấu hình provider và chưa gửi thành công.

Clear shopping cart sau khi order thành công.

====================================================
19. ADMIN AUTHENTICATION
====================================================

Khách hàng KHÔNG có login.

CHỈ ADMIN có login.

Route:

/admin/login

Admin login bằng:

email
password

Password phải lưu dạng hash bcrypt.

Không lưu plain password.

Sau login tạo secure session.

Cookie:

- Tên production: __Host-moon_spice_admin
- httpOnly
- secure production
- sameSite=lax
- path=/
- không đặt Domain
- idle timeout 2 giờ, absolute timeout 12 giờ

Bảo vệ mọi trang, Route Handler và Server Action trong /admin/**, ngoại trừ:

- GET /admin/login
- POST /api/admin/auth/login

Hai endpoint trên là guest-only; admin đã đăng nhập truy cập /admin/login phải được
redirect tới /admin.

POST /api/admin/auth/logout, /api/admin/**, route upload và mọi Server Action quản
trị còn lại bắt buộc session hợp lệ. Middleware dùng allow-list trên, nhưng mỗi
handler/action vẫn phải kiểm tra session ở server.

====================================================
20. ADMIN DASHBOARD
====================================================

Route:

/admin

Dashboard giao diện hiện đại.

Sidebar:

Dashboard

Products
Orders

Categories

Reviews

Customers / Order Customers

Settings

Logout

====================================================
21. DASHBOARD OVERVIEW
====================================================

Cards:

TỔNG DOANH THU

25.600.000đ


ĐƠN HÀNG

156


ĐƠN CHỜ XỬ LÝ

12


SẢN PHẨM

38

Các số trên chỉ là ví dụ bố cục; implementation phải query database, không hard-code.

Quy tắc số liệu:

- Tổng doanh thu chỉ cộng total của Order COMPLETED.
- Đơn hàng đếm tất cả Order không bị xóa.
- Đơn chờ xử lý gồm PENDING và CONFIRMED.
- Sản phẩm đếm Product active.
- Mặc định hiển thị toàn thời gian; có filter 7 ngày, 30 ngày và khoảng tùy chọn.
- Recent Orders hiển thị 10 đơn mới nhất.
- Tất cả mốc ngày quy đổi từ UTC sang Asia/Bangkok trước khi nhóm theo ngày.


Bên dưới có:

ĐƠN HÀNG GẦN ĐÂY

Order
Customer
Phone
Total
Status
Date

====================================================
22. ADMIN PRODUCT MANAGEMENT
====================================================

Route:

/admin/products

Table:

Image
Name
Category
Price
Stock
Status
Created
Action

Price hiển thị một giá nếu các active variant cùng giá, nếu không hiển thị khoảng
giá thấp nhất–cao nhất.

Stock hiển thị tổng stock của các active variant; mở chi tiết để xem từng variant.

Action:

Edit
Deactivate; hard-delete chỉ khi Product chưa từng được OrderItem tham chiếu
View

View mở storefront /products/[slug] trong tab mới nếu Product active. Product inactive
mở /admin/products/[id]/preview, bắt buộc AdminSession và no-store/noindex.

Button:

+ THÊM SẢN PHẨM

====================================================
23. CREATE PRODUCT
====================================================

/admin/products/new

Form:

Tên sản phẩm
Slug

Category

Short description

Full description

Ingredients

Usage instructions

Storage instructions
Origin
Manufacturer / Distributor
Shelf life
Allergen warning
Nutrition information (optional)

Danh sách biến thể, mỗi biến thể gồm:

SKU
Weight
Price
Original price
Stock
Active

Cho phép thêm, sửa và xóa dòng biến thể. Không cho lưu sản phẩm nếu chưa có ít
nhất một biến thể hợp lệ.

Product image

Gallery images

Ảnh gồm: file, alt text, role, focal point, ảnh chính và sort order. Role cho chọn
GALLERY, HERO_CUTOUT, HERO_BACKGROUND, HERO_BACKGROUND_MOBILE, FEATURED_BACKGROUND,
FEATURED_BACKGROUND_MOBILE, INGREDIENT_SHOWCASE hoặc USAGE. Admin có preview theo crop
desktop/mobile, reorder, retry và xóa. Tối đa 12 ảnh mỗi Product và
bắt buộc đúng một ảnh chính khi Product active.

Usage suggestions: tối đa 4 dòng gồm title, description optional, ảnh role=USAGE,
sortOrder và active. UI không cho chọn ảnh của Product khác; service vẫn validate lại.

Best Seller

Active

Button:

LƯU SẢN PHẨM

====================================================
24. EDIT PRODUCT
====================================================

/admin/products/[id]/edit

Admin có thể:

edit
update
deactivate

product.

Product đã có OrderItem chỉ được deactivate. Variant đã có OrderItem chỉ được đặt
active=false; variant chưa từng được tham chiếu mới được hard-delete.

Edit tồn kho không gửi giá trị stock tuyệt đối từ form cũ. Admin dùng thao tác
inventory adjustment gồm delta, reason và expectedVersion. Conflict version trả 409
và yêu cầu tải lại.

Delete/deactivate phải có confirmation dialog.

====================================================
25. ADMIN ORDER MANAGEMENT
====================================================

Route:

/admin/orders

Table:

Order ID
Customer
Phone
Date
Products
Total
Payment Method / Status
Status
Action

Filter:

All
Pending
Confirmed
Preparing
Shipping
Delivery Failed
Returned
Completed
Cancelled

Search theo:

Order Code
Phone
Customer Name

====================================================
26. ORDER DETAIL ADMIN
====================================================

/admin/orders/[id]

Hiển thị:

ORDER INFORMATION

Order Code
Created Date
Payment Method / Status
Status


CUSTOMER INFORMATION

Name
Phone
Email

Address


PRODUCTS

Image
Name
Price
Quantity
Subtotal


ORDER TOTAL

Subtotal
Shipping
Total


UI chỉ hiển thị trạng thái đích hợp lệ theo state machine ở mục 42:

- PENDING: CONFIRMED hoặc CANCELLED
- CONFIRMED: PREPARING hoặc CANCELLED
- PREPARING: SHIPPING hoặc CANCELLED
- SHIPPING: COMPLETED hoặc DELIVERY_FAILED
- DELIVERY_FAILED: SHIPPING hoặc RETURNED
- COMPLETED/CANCELLED/RETURNED: không có trạng thái đích

Có nút:

CẬP NHẬT TRẠNG THÁI

Form chuyển trạng thái thay đổi theo đích:

- COMPLETED: dialog bắt buộc checkbox "Đã thu tiền COD"; không checked thì không submit.
- DELIVERY_FAILED: bắt buộc reason, hiển thị generic cho customer nhưng giữ chi tiết ở AuditLog.
- DELIVERY_FAILED -> SHIPPING: xác nhận thử giao lại.
- RETURNED: bắt buộc chọn RESTOCKED hoặc DISCARDED và nhập reason; UI giải thích chỉ
  RESTOCKED mới cộng lại kho.
- CANCELLED: bắt buộc reason. UI không gửi paymentStatus, paidAt hoặc stock delta tùy ý;
  service tự suy ra và cập nhật atomically theo mục 42.

====================================================
27. DATABASE
====================================================

Tạo schema:

Admin
AdminSession
Category
Product
ProductImage
ProductUsageSuggestion
ProductVariant
Review
Order
OrderItem
SiteSetting
AuditLog
RateLimitBucket
BlobCleanupJob
DatabaseEnvironmentGuard

Physical table name dùng dạng số nhiều, snake_case; không dùng từ khóa SQL "order"
làm tên table.

Enum:

admin_role: OWNER, ADMIN
order_status: PENDING, CONFIRMED, PREPARING, SHIPPING, DELIVERY_FAILED, RETURNED,
COMPLETED, CANCELLED
payment_method: COD
payment_status: UNPAID, PAID, FAILED, REFUNDED
review_source: VERIFIED, IMPORTED, DEMO
blob_cleanup_status: PENDING, PROCESSING, DONE, FAILED
image_storage_provider: LOCAL, VERCEL_BLOB
product_image_role: GALLERY, HERO_CUTOUT, HERO_BACKGROUND, HERO_BACKGROUND_MOBILE,
FEATURED_BACKGROUND, FEATURED_BACKGROUND_MOBILE, INGREDIENT_SHOWCASE, USAGE
return_disposition: RESTOCKED, DISCARDED
database_environment: DEVELOPMENT, TEST, PREVIEW, PRODUCTION

Admin:

id UUID primary key default gen_random_uuid()
email text not null unique, luôn trim + lowercase trước khi lưu
displayName text not null
passwordHash text not null
role admin_role not null default ADMIN
active boolean not null default true
passwordChangedAt timestamptz not null default now()
createdAt timestamptz not null default now()
updatedAt timestamptz not null default now()

AdminSession:

id UUID primary key default gen_random_uuid()
adminId UUID not null foreign key Admin on delete cascade
tokenHash text not null unique
expiresAt timestamptz not null
lastUsedAt timestamptz not null default now()
revokedAt timestamptz nullable
createdAt timestamptz not null default now()
index (adminId, expiresAt)
index (expiresAt)

Category:

id UUID primary key default gen_random_uuid()
name text not null
slug text not null unique
description text nullable
imageUrl text nullable
imageStorageProvider image_storage_provider nullable
imageBlobPathname text nullable unique
imageAlt text nullable
sortOrder integer not null default 0 check >= 0
active boolean not null default true
createdAt timestamptz not null default now()
updatedAt timestamptz not null default now()

Category slug trim/lowercase theo định dạng [a-z0-9-] và không được đổi sau lần publish
đầu để giữ URL ổn định.

Category active phải có imageUrl, imageStorageProvider và imageAlt không rỗng; enforce
trong service. Asset LOCAL có URL dưới /seed/ và imageBlobPathname=null. Asset
VERCEL_BLOB phải có imageBlobPathname và URL đúng hostname Blob store của môi trường.

Product:

id UUID primary key default gen_random_uuid()
categoryId UUID not null foreign key Category on delete restrict
name text not null
slug text not null unique
description text not null
shortDescription text not null
ingredients text nullable
usage text nullable
storageInstructions text nullable
origin text nullable
manufacturer text nullable
distributor text nullable
shelfLife text nullable
allergenWarning text nullable
nutritionInfo text nullable
bestSeller boolean not null default false
active boolean not null default true
createdAt timestamptz not null default now()
updatedAt timestamptz not null default now()

Product slug trim/lowercase theo định dạng [a-z0-9-] và không được đổi sau lần Product
active đầu tiên. SKU trim/uppercase trước khi validate unique.

ProductImage:

id UUID primary key default gen_random_uuid()
productId UUID not null foreign key Product on delete cascade
url text not null
storageProvider image_storage_provider not null
blobPathname text nullable unique
role product_image_role not null default GALLERY
alt text not null
focalX smallint not null default 50 check từ 0 đến 100
focalY smallint not null default 50 check từ 0 đến 100
sortOrder integer not null default 0 check >= 0
isPrimary boolean not null default false
createdAt timestamptz not null default now()

Tạo partial unique index để mỗi Product có tối đa một isPrimary=true. Service yêu
cầu Product active phải có đúng một ảnh chính. Constraint/service bắt buộc asset
LOCAL có URL dưới /seed/ và blobPathname=null; asset VERCEL_BLOB có blobPathname khác
null và URL đúng Blob store. Chỉ asset VERCEL_BLOB được đưa vào hàng đợi xóa Blob.

Tạo partial unique index (productId, role) cho HERO_CUTOUT, HERO_BACKGROUND,
HERO_BACKGROUND_MOBILE, FEATURED_BACKGROUND, FEATURED_BACKGROUND_MOBILE và
INGREDIENT_SHOWCASE để mỗi Product có tối đa một ảnh cho từng placement. GALLERY và
USAGE được phép có nhiều ảnh. isPrimary chỉ hợp lệ với role GALLERY hoặc HERO_CUTOUT.
focalX/focalY là phần trăm focal point dùng khi crop scene. Service enforce tối đa 12
ProductImage/Product ở mọi API, không chỉ ẩn nút trong UI.

ProductUsageSuggestion:

id UUID primary key default gen_random_uuid()
productId UUID not null foreign key Product on delete cascade
productImageId UUID not null unique foreign key ProductImage on delete restrict
title text not null
description text nullable
sortOrder integer not null default 0 check >= 0
active boolean not null default true
createdAt timestamptz not null default now()
updatedAt timestamptz not null default now()
partial unique index (productId, sortOrder) where active=true
index (productId, active, sortOrder)

Service bắt buộc ProductUsageSuggestion.productImageId thuộc cùng productId và ảnh có
role=USAGE; title dài 2–80 ký tự, description tối đa 200 ký tự và mỗi Product có tối đa
4 suggestion active. Tạo/sửa suggestion và role ảnh chạy cùng transaction. Muốn xóa
ảnh USAGE đang được tham chiếu phải gỡ/deactivate suggestion trước.

ProductVariant:

id UUID primary key default gen_random_uuid()
productId UUID not null foreign key Product on delete cascade
sku text not null unique
weightGrams integer not null check > 0
price bigint not null check từ 0 đến 1000000000
originalPrice bigint nullable check originalPrice >= price
stock integer not null default 0 check >= 0
version integer not null default 1 check > 0
active boolean not null default true
createdAt timestamptz not null default now()
updatedAt timestamptz not null default now()
unique (productId, weightGrams)

Mỗi Product phải có ít nhất một ProductVariant. Giá và tồn kho được quản lý theo
biến thể, không lưu trùng ở Product.

Product active phải có ít nhất một ProductVariant active và đúng một ProductImage
chính. Enforce invariant này trong service transaction vì database CHECK không thể
kiểm tra bảng khác.

Create/update Product cùng metadata Variant/Image/UsageSuggestion phải dùng transaction
để không để Product active ở trạng thái thiếu variant, thiếu ảnh chính hoặc suggestion
tham chiếu sai Product/role.

Review:

id UUID primary key default gen_random_uuid()
productId UUID not null foreign key Product on delete cascade
orderItemId UUID nullable unique foreign key OrderItem on delete set null
customerName text not null
rating smallint not null check từ 1 đến 5
content text not null
source review_source not null
sourceReference text nullable
approved boolean not null default false
approvedBy UUID nullable foreign key Admin on delete set null
approvedAt timestamptz nullable
reviewedAt timestamptz nullable
createdAt timestamptz not null default now()

Rating hiển thị trên website phải được tính từ các review approved, không hard-code.
Service bắt buộc source=VERIFIED phải có orderItemId; source=IMPORTED phải có
sourceReference; source=DEMO không được hiển thị ở Production.

Order:

id UUID primary key default gen_random_uuid()
orderCode text not null unique
idempotencyKeyHash text not null unique
requestFingerprint text nullable
customerName text not null
phone text not null
phoneNormalized text not null
email text nullable
provinceCode text not null
provinceName text not null
wardCode text not null
wardName text not null
legacyDistrictName text nullable
addressLine text not null
addressDataVersion text not null
note text nullable
subtotal bigint not null check từ 0 đến 1000000000
shippingFee bigint not null check từ 0 đến 1000000000
total bigint not null check total = subtotal + shippingFee và total <= 1000000000
paymentMethod payment_method not null default COD
paymentStatus payment_status not null default UNPAID
paymentProviderTransactionId text nullable
paidAt timestamptz nullable
status order_status not null default PENDING
finalizedAt timestamptz nullable
reservationExpiresAt timestamptz not null
inventoryRestoredAt timestamptz nullable
returnDisposition return_disposition nullable
createdAt timestamptz not null default now()
updatedAt timestamptz not null default now()
index (status, createdAt)
index (phoneNormalized)

Service bắt buộc requestFingerprint khác null khi tạo Order và chỉ anonymization job
được đặt null sau retention. paymentStatus/paidAt/returnDisposition phải thỏa state
machine mục 42; không cho CRUD chung ghi trực tiếp các field này.

OrderItem:

id UUID primary key default gen_random_uuid()
orderId UUID not null foreign key Order on delete restrict
productId UUID not null foreign key Product on delete restrict
productVariantId UUID not null foreign key ProductVariant on delete restrict
productName text not null
productImageUrl text nullable
variantSku text not null
weightLabel text not null
unitPrice bigint not null check từ 0 đến 1000000000
quantity integer not null check từ 1 đến 99
lineSubtotal bigint not null check lineSubtotal = unitPrice * quantity
unique (orderId, productVariantId)
index (orderId)

Khi tạo OrderItem, productImageUrl bắt buộc là URL snapshot khác null của ảnh chính;
schema cho nullable chỉ để retention job xóa reference asset về sau.

SiteSetting:

key text primary key
value jsonb not null
updatedBy UUID nullable foreign key Admin on delete set null
createdAt timestamptz not null default now()
updatedAt timestamptz not null default now()

Mỗi key có Zod schema riêng. Runtime chỉ dùng SiteSetting làm nguồn chuẩn; environment
variable chỉ dùng bootstrap khi seed lần đầu.

Homepage setting contract:

- hero_product_id: UUID Product.
- featured_product_id: UUID Product; đây là nguồn duy nhất cho
  EditorialTriptych/FeaturedPurchaseBanner, không có cờ Product.featured.
- homepage_best_seller_limit: integer từ 1 đến 12.

Service validate Product được chọn active, có đúng một ảnh chính và ít nhất một variant
active. `resolveHomepageProduct(slot)` luôn revalidate khi đọc vì Product có thể bị
deactivate sau lúc lưu: hero invalid thì chọn deterministic fallback từ Product hợp lệ
theo bestSeller desc, createdAt asc, id asc; featured invalid thì dùng cùng resolver và
fallback deterministic. Nếu không còn Product hợp lệ, ẩn nguyên cụm tương ứng và log
warning thay vì render card/CTA chết. IngredientStory thiếu ingredients thì dùng empty
state trung tính; nếu có ingredients nhưng thiếu INGREDIENT_SHOWCASE thì dùng primary
image trong khung cream. Usage/Review giữ fallback/empty state ở mục 8–9.

AuditLog:

id UUID primary key default gen_random_uuid()
adminId UUID nullable foreign key Admin on delete set null; null nghĩa là system
action text not null
entityType text not null
entityId UUID nullable
orderId UUID nullable foreign key Order on delete restrict
productVariantId UUID nullable foreign key ProductVariant on delete set null
fromStatus order_status nullable
toStatus order_status nullable
stockDelta integer nullable
reason text nullable
requestId text nullable
beforeData jsonb nullable
afterData jsonb nullable
metadata jsonb nullable
createdAt timestamptz not null default now()

AuditLog append-only; application không có chức năng update/delete log.

RateLimitBucket:

keyHash text not null
action text not null
windowStart timestamptz not null
count integer not null check > 0
expiresAt timestamptz not null
primary key (keyHash, action, windowStart)
index (expiresAt)

Rate limit dùng atomic upsert trên Neon, chỉ lưu
HMAC-SHA-256(RATE_LIMIT_SECRET, normalizedKey) của IP/email/phone và có job dọn bucket
hết hạn. Không dùng memory process làm rate limiter trên Vercel.

BlobCleanupJob:

id UUID primary key default gen_random_uuid()
pathname text not null unique
reason text not null
status blob_cleanup_status not null default PENDING
attempts integer not null default 0 check >= 0
nextAttemptAt timestamptz not null default now()
lastErrorCode text nullable
createdAt timestamptz not null default now()
updatedAt timestamptz not null default now()
index (status, nextAttemptAt)

Không lưu raw provider error có thể chứa token. Daily maintenance claim job bằng
atomic update/SKIP LOCKED, retry có backoff và DONE idempotent khi Blob đã không tồn tại.

DatabaseEnvironmentGuard:

singleton boolean primary key default true check singleton = true
environment database_environment not null
instanceId UUID not null unique
createdAt timestamptz not null default now()
updatedAt timestamptz not null default now()

Bảng này có đúng một row, được tạo/đổi bằng provisioning command dùng migration role,
không nằm trong seed ứng dụng. Runtime/test-reset role chỉ có SELECT, không có
INSERT/UPDATE/DELETE. Neon branch clone từ Production vẫn mang nhãn PRODUCTION và phải
được operator re-mark TEST/PREVIEW bằng command explicit trước khi dùng; thiếu row hoặc
sai nhãn thì mọi thao tác destructive fail closed.

====================================================
28. SAMPLE DATABASE
====================================================

Seed ít nhất 8 sản phẩm:

Italian Herb Spice
Garlic Herb Mix
BBQ Seasoning
Chili Garlic
Black Pepper Mix
Rosemary Salt
Seafood Seasoning
Steak Seasoning

Mỗi sản phẩm seed có category, ít nhất 2 ProductVariant và đúng một ProductImage chính.
Riêng Product hero/featured mặc định phải có bộ asset local đủ để visual regression:
HERO_CUTOUT, HERO_BACKGROUND, FEATURED_BACKGROUND, INGREDIENT_SHOWCASE và tối đa 4 ảnh USAGE kèm
ProductUsageSuggestion. Seed dùng asset có giấy phép trong public/seed, lưu
storageProvider=LOCAL/blobPathname=null để không phụ thuộc Blob khi khởi tạo lần đầu;
ảnh admin upload sau đó lưu storageProvider=VERCEL_BLOB. Nếu thiếu asset optional,
fallback đúng mục 4/7/10 và không lấy ảnh Product khác.

Seed SiteSetting idempotent đặt hero_product_id và featured_product_id cùng trỏ Italian
Herb Spice để baseline giống ảnh, homepage_best_seller_limit=4; admin có thể đổi hai
Product độc lập sau đó qua /admin/settings.

Review source=DEMO chỉ seed ở Development/Test và phải có nhãn dữ liệu minh họa.
Không seed review giả vào Production. Production chỉ hiển thị review VERIFIED hoặc
IMPORTED đã được admin xác nhận nguồn; chỉ review có orderItemId mới được gắn nhãn
"Đã mua hàng".

====================================================
29. RESPONSIVE
====================================================

Website phải đẹp trên:

1920px
1440px
1024px
768px
430px
390px
320px

Kiểm tra thêm landscape mobile và browser zoom 200%.

Mobile ưu tiên UX.

Không được overflow ngang.

Storefront desktop >=1120px:

- Announcement 24–28px; header 76–80px.
- Hero grid 34/32/34, cao 500–680px; packshot là điểm nhìn chính.
- USP 4 cột; EditorialTriptych 3 cột; FeaturedPurchaseBanner hai vùng 45/55.
- Container/gutter và typography theo design tokens mục 2.

Tablet 768–1119px:

- Header dùng hamburger để nav tiếng Việt không bị ép.
- Hero hai cột 44/56: copy trái, packshot phải; scene là background/right crop, cao
  khoảng 580–640px.
- USP 2x2; EditorialTriptych hai cột với ReviewList full-width hàng dưới.
- FeaturedPurchaseBanner giữ hai cột khi đủ rộng; control được wrap nhưng không chồng ảnh.

Storefront mobile <=767px:

- Announcement được xuống tối đa hai dòng, không marquee/cắt chữ; header 60–64px.
- Hero một cột theo DOM order: copy -> packshot -> CTA -> badge/supporting copy. Packshot
  rộng 68–78vw, tối đa 340px; hero padding 32px 16px 40px.
- Dùng HERO_BACKGROUND_MOBILE nếu có; nếu scene làm chữ khó đọc thì ẩn scene và dùng
  nền cream/olive, không đặt text lên vùng ảnh nhiều chi tiết thiếu scrim.
- CTA chính rộng 100%, tối đa 360px. Badge không che packshot/CTA.
- USP 2 cột từ 390px; dưới 390px là 1 cột icon trái/text phải.
- EditorialTriptych một cột. UsageGrid giữ 2 cột tại 390/430px và cho 1 cột tại 320px.
- FeaturedPurchaseBanner xếp copy/variant/giá/CTA trước, packshot/scene sau; không overlay
  text lên ảnh. DOM order phải hợp lý ngay cả khi tắt CSS.

Mobile layout bắt buộc:

- Product gallery dùng carousel có thumbnail tùy không gian.
- Product filter dùng bottom sheet/drawer.
- Checkout summary nằm dưới form và có sticky total/CTA vừa màn hình.
- Admin sidebar chuyển thành drawer.
- Bảng admin chuyển thành card list hoặc scroll bên trong container có nhãn cột;
  body/page không được overflow ngang.

====================================================
30. UX
====================================================

Thêm:

Skeleton loading

Toast:

"Đã thêm sản phẩm vào giỏ hàng"

Empty cart

Empty orders

404 page

Error state

Loading state

Confirmation modal

Smooth scroll

Subtle animation.

====================================================
31. SECURITY
====================================================

Bắt buộc:

Server-side validation

Sanitize input

Validate quantity

Validate stock

Không nhận product price từ client.

Server tự lấy price từ database.

Không cho quantity <= 0.

Không cho đặt quantity > stock.

Admin route phải authentication.

Không expose database credentials.

Secrets phải nằm trong:

.env.local chỉ ở local development và phải gitignore.

Production/Preview secrets phải nằm trong Vercel Environment Variables đúng scope,
không commit vào repository và không expose bằng tiền tố NEXT_PUBLIC_.

Giới hạn input phía server tối thiểu:

- name 2–120 ký tự
- Product.shortDescription 10–240 ký tự
- Product.description tối đa 10000 ký tự
- Product.ingredients và Product.usage mỗi field tối đa 2000 ký tự
- Review.customerName 2–80 ký tự; Review.content 10–1000 ký tự
- email tối đa 254 ký tự
- phone sau normalize 9–15 chữ số
- addressLine tối đa 255 ký tự
- note tối đa 1000 ký tự
- search tối đa 100 ký tự
- request body checkout tối đa 64 KB
- reject unknown fields

Homepage presentation limits, không cắt dữ liệu gốc trong database:

- Hero/banner Product.name line-clamp 2; shortDescription line-clamp 3–4.
- Ingredient excerpt line-clamp 4; Usage title/caption line-clamp 2.
- Review content line-clamp 3 và customerName một dòng; nội dung đầy đủ ở Product Detail.
- Tối đa 4 variant hiển thị dạng chip trong FeaturedPurchaseBanner; từ 5 variant dùng
  select/listbox accessible để không wrap phá layout. Tất cả variant vẫn có thể chọn.

====================================================
32. SEO
====================================================

Thiết lập metadata:

title
description
OpenGraph

Product page có dynamic metadata.

URL thân thiện:

/products/italian-herb-spice

====================================================
33. PROJECT STRUCTURE
====================================================

Tổ chức code rõ ràng:

app/
   page.tsx

   products/
   categories/[slug]/
   cart/
   checkout/
   order-success/
   track-order/
   recipes/
   about/
   faq/
   privacy/
   terms/
   shipping-policy/
   returns/
   contact/

   admin/
      login/
      products/
      orders/
      categories/
      reviews/
      customers/
      settings/

   api/
      admin/
      checkout/
      cron/
      health/

components/

components/shop/
components/shop/home/
   hero-product.tsx
   usp-strip.tsx
   editorial-triptych.tsx
   ingredient-story.tsx
   usage-grid.tsx
   review-list.tsx
   featured-purchase-banner.tsx
components/admin/
components/ui/

lib/
   auth/
   services/
   validation/
   rate-limit/
   cache/
   storage/

db/
   schema/
   index.ts

drizzle/

content/

data/

scripts/

tests/
   unit/
   integration/
   e2e/

types/

public/

docs/references/ chỉ lưu ảnh tham chiếu nội bộ khi owner xác nhận quyền sử dụng; không
import/serve thư mục này ra storefront. Implementation không được phụ thuộc file ảnh
tham chiếu để render runtime.

====================================================
34. IMPORTANT
====================================================

Hãy tạo WEBSITE HOÀN CHỈNH.

Không chỉ tạo UI mockup.

Các chức năng phải hoạt động thật:

Product + ProductVariant + ProductImage + ProductUsageSuggestion CRUD
Category management
Vercel Blob upload/delete lifecycle
Add to cart
Update cart
Delete cart item
Cart reconciliation và checkout quote
Checkout
Create order idempotent + atomic stock update
Admin login
Admin product management
Admin order management
Update order status
Inventory adjustment có optimistic concurrency
Shipping/settings management và cache invalidation
Order access/track-order bảo vệ PII

Không tạo button giả.

Không để TODO.

Không để lorem ipsum.

Không hard-code danh sách sản phẩm trong frontend.

Product phải được lấy từ database.

Homepage phải có chất lượng thiết kế tương đương một website bán hàng thực tế.

Ưu tiên chất lượng UI cao.

Giao diện USER phải giữ phong cách premium food ecommerce giống MOOR SPICE.

Giao diện ADMIN phải đơn giản, sạch, dễ quản lý.

====================================================
35. DEPLOYMENT
====================================================

Chuẩn bị project để deploy lên Vercel.

Tạo:

.env.example
README.md
vercel.json cho Cron daily-maintenance và cấu hình deploy cần thiết

README phải hướng dẫn:

1. npm install cho local development; npm ci cho CI/deploy
2. cấu hình Neon PostgreSQL
3. DATABASE_URL pooled và DATABASE_URL_UNPOOLED direct
4. migration database
5. seed database
6. tạo admin
7. npm run dev
8. deploy Vercel

Kiểm tra:

npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build

phải thành công trước khi hoàn thành project.

====================================================
36. QUYẾT ĐỊNH KIẾN TRÚC BẮT BUỘC
====================================================

Sử dụng Neon PostgreSQL làm database production và Drizzle ORM làm ORM duy nhất.

Runtime database driver bắt buộc dùng @neondatabase/serverless WebSocket Pool với
drizzle-orm/neon-serverless trên Node.js runtime. Lý do: checkout, cancel order và
inventory adjustment cần interactive transaction, rollback và row lock.

Không dùng neon-http cho các luồng nhiều bước cần interactive transaction.

DATABASE_URL là Neon pooled connection cho runtime. DATABASE_URL_UNPOOLED là direct
connection chỉ dùng cho Drizzle migration, pg_dump và restore.

Không truy cập database trực tiếp từ Client Component.

Tổ chức nghiệp vụ theo lớp rõ ràng:

- Route Handler / Server Action
- Server-side validation
- Service xử lý nghiệp vụ
- Repository dùng Drizzle query
- Database

TypeScript bật strict mode.

Tất cả response API phải có cấu trúc nhất quán, mã HTTP đúng và không trả stack
trace hoặc thông tin nội bộ cho client.

====================================================
37. PRODUCT VARIANT VÀ TỒN KHO
====================================================

Các khối lượng 50g, 100g, 200g là các ProductVariant riêng biệt.

Mỗi variant có:

- SKU riêng và unique
- weightGrams là integer dương, đơn vị chuẩn gram
- price
- originalPrice
- stock
- version để optimistic concurrency
- active

Product detail, cart, checkout và OrderItem phải sử dụng variantId.

Không cho thêm variant inactive hoặc hết hàng vào cart.

Backend phải kiểm tra lại variant, trạng thái product, giá và stock trước khi tạo
đơn hàng.

Checkout có bước server quote:

- Client chỉ gửi [{ variantId, quantity }].
- Server trả unitPrice, availability, subtotal, shipping, total và quoteHash.
- POST tạo Order gửi lại quoteHash nhưng server vẫn tính lại trong transaction.
- Nếu giá, trạng thái hoặc stock thay đổi, không tạo Order và không trừ stock; trả
  409 CHECKOUT_CHANGED kèm quote mới và chỉ rõ item thay đổi.
- UI giữ dữ liệu form, yêu cầu khách xác nhận lại rồi tạo idempotency key mới.
- Không âm thầm đặt hàng theo giá mới.

====================================================
38. TRANSACTION, IDEMPOTENCY VÀ ORDER CODE
====================================================

Client tạo UUIDv4 idempotency key cho một checkout intent, giữ nguyên key khi retry
hoặc network timeout; tạo key mới khi khách sửa cart, địa chỉ hoặc xác nhận quote mới.
Server reject key không phải canonical UUIDv4.

Server lưu idempotencyKeyHash = SHA-256("moon-spice/idempotency-key/v1\0" + rawKey).
Hash ổn định này không chứa PII và không phụ thuộc secret cần rotate. Sau khi normalize
payload, server tính requestFingerprint = HMAC-SHA-256(rawKeyBytes,
"moon-spice/order-payload/v1\0" + canonicalPayload). UUIDv4 có entropy cao đóng vai
trò khóa HMAC; raw key và canonical payload không được lưu/log:

- Cùng key + cùng fingerprint: trả Order cũ với HTTP 200, replayed=true, không tạo
  Order/OrderItem và không trừ stock lần nữa; cấp lại order-access cookie.
- Cùng key + fingerprint khác: HTTP 409 IDEMPOTENCY_KEY_REUSED.
- Cùng key nhưng requestFingerprint đã được xóa theo retention: HTTP 409
  IDEMPOTENCY_WINDOW_EXPIRED; không tạo đơn mới bằng key cũ.
- Validation thất bại trước khi transaction commit không chiếm key.

Khi anonymize Order, đặt requestFingerprint=null nhưng giữ idempotencyKeyHash unique để
retry rất cũ không thể tạo/trừ kho lần nữa. Vì key hash không dùng server secret,
rotation credential không thể làm cùng raw key biến thành key database mới.

Trước transaction, gộp dòng trùng variantId và sort variantId để giảm deadlock.

Trong một database transaction:

1. Trước khi đọc hoặc trừ stock, derive signed 64-bit lock key từ idempotencyKeyHash và
   gọi pg_advisory_xact_lock. Collision chỉ serialize thêm request không liên quan.
2. Sau khi có lock, query Order theo idempotencyKeyHash ngay trong transaction. Nếu đã
   có, so fingerprint và trả replay/REUSED/WINDOW_EXPIRED như trên; tuyệt đối không đi
   tiếp tới stock. Đây là bước bắt buộc để hai request đồng thời cùng key luôn hội tụ
   về một Order.
3. Nếu chưa có Order, kiểm tra quote, Product và ProductVariant active.
4. Với từng variant, atomic update:
   UPDATE stock = stock - quantity, version = version + 1
   WHERE id = variantId AND stock >= quantity AND active = true
   RETURNING dữ liệu cần snapshot.
5. Thiếu bất kỳ row nào thì rollback toàn bộ và trả 409 OUT_OF_STOCK hoặc
   CHECKOUT_CHANGED.
6. Insert Order, OrderItem và AuditLog. Unique idempotencyKeyHash vẫn là lớp bảo vệ cuối.
7. orderCode do server tạo, có unique constraint và bounded retry khi collision.

Hủy đơn phải dùng cùng một cancel service cho admin và system expiry:

- SELECT Order FOR UPDATE để khóa đúng Order trước khi validate transition.
- Chỉ hoàn kho nếu inventoryRestoredAt IS NULL.
- Cộng lại đúng quantity từ OrderItem, tăng version, đặt CANCELLED và
  inventoryRestoredAt=now() trong cùng transaction.
- Request hủy lặp trả trạng thái hiện tại, không cộng stock lần hai.
- COMPLETED/CANCELLED/RETURNED là terminal.

Admin không ghi đè stock tuyệt đối từ form edit. Inventory adjustment gửi delta,
reason và expectedVersion:

UPDATE stock = stock + delta, version = version + 1
WHERE id = variantId AND version = expectedVersion AND stock + delta >= 0.

Không update được row thì trả 409 STALE_INVENTORY. Adjustment và AuditLog phải cùng
transaction.

reservationExpiresAt của PENDING mặc định là createdAt + 48 giờ theo SiteSetting.
Vercel Cron hoặc job CLI gọi đúng cancel service với actor=system, xử lý batch nhỏ
bằng row lock/SKIP LOCKED; không viết luồng hoàn kho riêng.

Trên Vercel Hobby, Cron chỉ chạy một lần mỗi ngày và có sai số trong giờ chạy, nên 48
giờ là thời điểm đủ điều kiện hết hạn chứ không phải SLA hoàn kho cứng. `vercel.json`
Demo gọi /api/cron/daily-maintenance lúc 19:00 UTC (02:00 Asia/Bangkok); thời gian hoàn
kho thực tế mục tiêu là 48–72 giờ. Trước mỗi reconcile/quote/checkout, service lazy-
expire các Order PENDING đã quá hạn có chứa variant đang được yêu cầu, rồi mới tính
availability. Daily job vẫn reconciliation toàn cục cho đơn không được truy cập lại.

Production cần Cron ít nhất mỗi 15 phút (hoặc scheduler tương đương) nếu cam kết hoàn
kho gần 48 giờ; phải đổi lịch trước go-live. Job idempotent expire PENDING, dọn
session/rate-limit, xử lý Blob cleanup queue và anonymize PII theo batch có time budget
dưới function limit. CLI gọi lại cùng service làm manual recovery fallback, không viết
logic khác. Không mô tả Hobby là bảo đảm đúng 48 giờ.

====================================================
39. SHIPPING VÀ TÍNH TIỀN
====================================================

Tiền tệ là VND và lưu bằng PostgreSQL bigint, không dùng floating point. Drizzle map
sang JavaScript number chỉ sau khi xác nhận Number.isSafeInteger. Backend từ chối
Order total > 1000000000 VND.

Quy tắc mặc định:

- Miễn phí vận chuyển khi subtotal >= 500000.
- Phí vận chuyển cố định 30000 khi subtotal < 500000.

SiteSetting là nguồn runtime duy nhất cho:

- free_shipping_threshold
- default_shipping_fee
- pending_order_expiry_hours

Environment variable INITIAL_FREE_SHIPPING_THRESHOLD,
INITIAL_DEFAULT_SHIPPING_FEE và INITIAL_PENDING_ORDER_EXPIRY_HOURS chỉ dùng làm
bootstrap/fallback khi seed lần đầu; không override giá trị đã có trong database.

Một server service getShippingPolicy() được Checkout và Announcement dùng chung.
Zod bắt mọi giá trị tiền là integer VND không âm.

total = subtotal + shippingFee.

Announcement bar phải lấy cùng cấu hình ngưỡng miễn phí vận chuyển để không hiển
thị khác với logic checkout.

Sau khi admin cập nhật setting và transaction thành công, invalidate cache tag
site-settings cùng các route /, /cart và /checkout. Order cũ giữ shippingFee snapshot,
không tính lại.

====================================================
40. IMAGE STORAGE
====================================================

Ảnh catalog dùng Vercel Blob PUBLIC store. Không dùng private store và không lưu file
upload vào filesystem cục bộ/runtime của Vercel.

Phiên bản đầu dùng server upload tại Node.js Route Handler đã xác thực admin. Giới
hạn mỗi file 3 MiB để nằm an toàn dưới request body limit 4.5 MB của Vercel. Nếu sau
này cần file lớn hơn mới chuyển sang client-direct upload; endpoint cấp upload token
vẫn phải authenticate/authorize admin và validate clientPayload.

Biến môi trường:

BLOB_READ_WRITE_TOKEN

Chỉ chấp nhận JPEG, PNG, WebP hoặc AVIF. Server phải kiểm magic bytes, MIME type,
decode ảnh thành công, kích thước pixel tối đa 6000x6000, strip EXIF và reject ảnh
không hợp lệ. Không chỉ tin extension hoặc Content-Type từ client.

Pathname dùng UUID dưới prefix products/ hoặc categories/, bật random suffix, không overwrite và
không nhận pathname tùy ý từ client. Chỉ chấp nhận URL/pathname trả về từ đúng Blob
store của project.

next/image remotePatterns chỉ allow hostname của Blob store đã cấu hình; không dùng
wildcard tùy ý. Ảnh mới dùng immutable URL và responsive sizes phù hợp.

Sau upload thành công, lưu storageProvider=VERCEL_BLOB, url, blobPathname, role, alt và
focal point vào ProductImage. Asset seed lưu storageProvider=LOCAL, URL /seed/... và
blobPathname=null. Attach, đổi role, reorder, set-primary và liên kết
ProductUsageSuggestion chạy trong database transaction.

Khi thay hoặc xóa ảnh:

1. Nếu ảnh đang được ProductUsageSuggestion tham chiếu thì reject hoặc gỡ/deactivate
   suggestion trong cùng transaction; sau đó commit việc gỡ ProductImage reference.
2. Với LOCAL, không gọi Blob API. Với VERCEL_BLOB, chỉ enqueue/call
   del(blobPathname) khi không còn ProductImage/Category reference và không có
   OrderItem.productImageUrl tham chiếu URL đó.
3. Nếu Blob delete lỗi, ghi cleanup job để retry; không rollback database đã commit.

Asset contract cho storefront:

- HERO_CUTOUT: chỉ nhận PNG/WebP/AVIF có alpha thật; decoder phải xác nhận có vùng
  transparent có ý nghĩa ở biên ảnh, reject JPEG/ảnh nền đặc cho role này. Admin phải
  preview trên cả nền cream và olive, không crop nhãn sản phẩm. Ảnh nền đặc chỉ được
  giữ ở GALLERY rồi dùng primary fallback trong khung cream.
- HERO_BACKGROUND: scene desktop có safe area cho copy/packshot, crop 16:9.
- HERO_BACKGROUND_MOBILE: optional scene 4:5; thiếu thì crop scene desktop theo focal point.
- FEATURED_BACKGROUND: scene olive/dark riêng cho banner, safe area 45/55; không dùng
  chung với HERO_BACKGROUND sáng.
- FEATURED_BACKGROUND_MOBILE: optional scene dọc cho banner; thiếu thì nền olive thuần
  + packshot hoặc crop FEATURED_BACKGROUND theo focal point.
- INGREDIENT_SHOWCASE: ảnh 4:3 đúng Product.
- USAGE: ảnh 4:3 hoặc 1:1 gắn đúng ProductUsageSuggestion.
- GALLERY: ảnh Product Detail/card; không tự dùng làm scene nếu thiếu role tương ứng,
  ngoại trừ primary fallback cream đã nêu.

Chỉ một ảnh LCP được priority/fetchPriority=high. Packshot dùng sizes
`(max-width: 767px) 78vw, (max-width: 1119px) 52vw, 34vw`; ảnh dưới fold lazy-load và
khóa aspect-ratio để tránh CLS. Decorative scene có alt=""; packshot dùng alt mô tả
Product, không lặp cùng alt cho mọi layer.

Upload thành công nhưng database attach thất bại phải được đánh dấu orphan. Job/CLI
idempotent xóa orphan sau 24 giờ, chỉ trong prefix do ứng dụng sở hữu. Callback hoặc
retry không được tạo duplicate ProductImage.

Nếu database outage khiến không thể tạo BlobCleanupJob, daily maintenance list Blob
theo app prefix bằng cursor, chỉ xét object cũ hơn 24 giờ và xóa khi không có bất kỳ
ProductImage/Category có storageProvider=VERCEL_BLOB hoặc OrderItem reference. Không
bao giờ xóa chỉ dựa vào tên.

Ảnh đã được OrderItem snapshot tham chiếu phải giữ lại tới khi hết SiteSetting
order_asset_retention_days (bootstrap 730 ngày tính từ finalizedAt). Sau hạn, job đặt
OrderItem.productImageUrl=null; khi URL không còn reference catalog/đơn nào thì mới
enqueue xóa Blob. Lịch sử đơn vẫn giữ tên/SKU/khối lượng/giá nhưng không giữ ảnh vĩnh
viễn, tránh đầy quota Blob Hobby. Owner phải xác nhận thời hạn pháp lý/thương mại thật
trước Production.

Ảnh seed/placeholder phải có giấy phép sử dụng phù hợp hoặc là asset do dự án tự
tạo.

Development, Preview và Production dùng Blob store riêng. Nếu giới hạn tài khoản
không cho tách store, Preview dùng fake/local Blob adapter và không được quyền ghi
hoặc xóa asset Production.

====================================================
41. ADMIN AUTH VÀ SECURITY BỔ SUNG
====================================================

AdminSession lưu hash của session token, adminId, expiresAt, createdAt và revokedAt.
Raw token chỉ tồn tại trong cookie httpOnly.

Session token tạo bằng CSPRNG tối thiểu 32 random bytes, lưu tokenHash unique bằng
HMAC-SHA-256(SESSION_SECRET, rawToken).
Cookie production tên __Host-moon_spice_admin; local development dùng
moon_spice_admin vì không có HTTPS.

Cookie bắt buộc:

- httpOnly
- secure trong production
- sameSite=lax
- path=/
- không đặt Domain
- idle timeout 2 giờ
- absolute timeout 12 giờ

Logout phải revoke session ở database và xóa cookie.

Đổi password, deactivate Admin hoặc security incident phải revoke toàn bộ session
của Admin đó. Có cleanup job cho session hết hạn/revoked.

Mọi trang, Route Handler và Server Action dưới phạm vi admin đều phải kiểm tra
session và quyền ở server, không chỉ dựa vào middleware hoặc ẩn UI.

Role:

- OWNER có toàn quyền và được chạy thao tác tạo/deactivate Admin qua CLI bảo vệ.
- ADMIN quản lý Product, Category, Review, Order, Inventory, Customers và SiteSetting;
  không được thay đổi role/credential của Admin khác.

Bổ sung:

- Rate limit dùng RateLimitBucket trên Neon, atomic và dùng chung giữa serverless instances.
- Admin login: hai bucket độc lập, tối đa 20 lần/15 phút theo hash IP và 5 lần/15
  phút theo hash email; request chỉ được xử lý khi cả hai bucket còn quota.
- Cart reconcile/checkout quote: tối đa 60 lần/phút theo hash IP, request body tối đa
  64 KiB, tối đa 50 dòng và quantity mỗi dòng từ 1 đến 99.
- Tạo Order: hai bucket độc lập, tối đa 10 lần/10 phút theo hash IP và 5 lần/10 phút
  theo hash phone; request phải qua cả hai.
- Track order: hai bucket độc lập, tối đa 10 lần/15 phút theo hash IP và 5 lần/15
  phút theo hash orderCode; luôn trả lỗi generic.
- Upload: tối đa 30 file/giờ/Admin và vẫn áp dụng quota 12 ảnh/Product.
- Nếu Neon/rate-limit unavailable, auth, mutation và endpoint chứa PII fail closed với
  503; không silently bỏ rate limit. Public catalog read không phụ thuộc rate limiter.
- Chống CSRF bằng SameSite cookie kết hợp kiểm tra Origin cho request thay đổi dữ liệu.
- Chỉ chấp nhận POST/PATCH/DELETE cho user mutation; logout không dùng GET.
- Ngoại lệ GET /api/cron/daily-maintenance chỉ dành cho Vercel Cron, bắt buộc kiểm tra
  Authorization Bearer CRON_SECRET, không nhận cookie và không trả dữ liệu Order.
- CSP chứa frame-ancestors 'none', nonce/hash phù hợp và allowlist Vercel Blob/font.
- Security headers: Content-Security-Policy, Strict-Transport-Security ở production,
  X-Content-Type-Options, Referrer-Policy và Permissions-Policy.
- API same-origin mặc định; không bật CORS wildcard.
- Không log password, session token, địa chỉ đầy đủ hoặc dữ liệu nhạy cảm.
- Normalize và validate input bằng Zod; escape output đúng ngữ cảnh để chống XSS.
- Password bcrypt cost tối thiểu 12 và không bao giờ được trả về API.

Password admin từ 12 đến 72 UTF-8 bytes. Login error phải dùng thông báo chung,
không tiết lộ email tồn tại; so sánh hash không tạo timing shortcut rõ ràng.

Tạo admin đầu tiên bằng script npm run admin:create đọc ADMIN_EMAIL và password từ
prompt/secret input. Đổi mật khẩu bằng npm run admin:set-password. Hai script phải
explicit, không chạy trong build/deploy và không nằm trong database seed.

Không commit mật khẩu hoặc hash mặc định vào repository. Password/hash không được
truyền qua environment variable dùng chung cho build.

====================================================
42. ORDER STATUS RULES
====================================================

Chỉ cho phép các chuyển trạng thái:

PENDING -> CONFIRMED hoặc CANCELLED
CONFIRMED -> PREPARING hoặc CANCELLED
PREPARING -> SHIPPING hoặc CANCELLED
SHIPPING -> COMPLETED hoặc DELIVERY_FAILED
DELIVERY_FAILED -> SHIPPING hoặc RETURNED

COMPLETED, CANCELLED và RETURNED là trạng thái cuối, không được chuyển tiếp.

Khi vào COMPLETED, CANCELLED hoặc RETURNED, set finalizedAt=now() trong cùng transaction.
Service bắt buộc finalizedAt null ở trạng thái chưa kết thúc và khác null ở trạng
thái terminal.

Vòng đời COD bắt buộc:

- Tạo Order ở paymentStatus=UNPAID, paidAt=null.
- SHIPPING -> COMPLETED chỉ hợp lệ khi admin xác nhận đã thu tiền mặt. Cùng transaction
  đặt paymentStatus=PAID và paidAt=now(); không có trạng thái COMPLETED nhưng UNPAID.
- SHIPPING -> DELIVERY_FAILED đặt paymentStatus=FAILED, paidAt=null và bắt buộc reason.
- DELIVERY_FAILED -> SHIPPING là thử giao lại và đặt paymentStatus=UNPAID.
- DELIVERY_FAILED -> RETURNED chỉ sau khi xác nhận hàng đã quay về. Admin bắt buộc chọn
  returnDisposition=RESTOCKED hoặc DISCARDED. RESTOCKED hoàn toàn bộ quantity đúng một
  lần và set inventoryRestoredAt; DISCARDED không cộng kho. Cả hai ghi AuditLog chi tiết.
- CANCELLED chỉ xảy ra trước SHIPPING, hoàn kho đúng một lần và giữ UNPAID.
- REFUNDED bị cấm trong COD MVP; chỉ bật khi có workflow refund riêng.

Backend phải xác thực transition; không tin status gửi từ frontend.

Update trạng thái nhận expectedStatus và chạy conditional update/row lock trong
transaction. Hai request concurrent chỉ một request được phép chuyển trạng thái;
request còn lại nhận 409 INVALID_ORDER_TRANSITION hoặc trạng thái hiện tại.

Mỗi lần thay đổi trạng thái phải ghi AuditLog gồm adminId, orderId, fromStatus,
toStatus và createdAt.

====================================================
43. DELETE VÀ TÍNH TOÀN VẸN DỮ LIỆU
====================================================

Product đã xuất hiện trong OrderItem không được hard-delete. Admin chỉ được đặt
active=false.

ProductVariant đã xuất hiện trong OrderItem không được hard-delete, chỉ được đặt
active=false. ProductVariant chưa từng được tham chiếu chỉ được xóa trong transaction
và Product vẫn phải còn ít nhất một variant hợp lệ.

ProductImage đang được ProductUsageSuggestion tham chiếu không được hard-delete trước
khi gỡ/deactivate suggestion. Đổi role khỏi USAGE cũng phải validate reference trong
cùng transaction.

Category đang có Product không được xóa trực tiếp; cho phép deactivate hoặc yêu cầu
chuyển sản phẩm sang category khác.

Order và OrderItem không được xóa từ giao diện admin.

Khai báo foreign key, unique constraint, check constraint và index cần thiết:

- Product.slug unique
- ProductVariant.sku unique
- Order.orderCode unique
- Order.idempotencyKeyHash unique
- ProductVariant (productId, weightGrams) unique
- ProductUsageSuggestion productImageId unique và partial unique
  (productId, sortOrder) where active=true
- OrderItem (orderId, productVariantId) unique
- quantity > 0
- price >= 0
- stock >= 0
- rating từ 1 đến 5
- originalPrice nullable hoặc originalPrice >= price
- total = subtotal + shippingFee
- index cho Order(status, createdAt), Order(phone), Product(categoryId, active),
  ProductVariant(productId, active), ProductUsageSuggestion(productId, active, sortOrder),
  Review(productId, approved),
  AdminSession(tokenHash), AdminSession(expiresAt) và OrderItem(orderId)

Timestamp lưu UTC; giao diện hiển thị theo Asia/Bangkok.

====================================================
44. CÁC ROUTE VÀ CHỨC NĂNG CÒN THIẾU
====================================================

Các menu ở header phải có route hoạt động thật:

/recipes
/recipes/[slug]
/about
/faq
/categories/[slug]

Header mapping:

- Logo -> /
- Sản phẩm -> /products
- Gia vị -> /#categories
- Combo -> /categories/combo
- Công thức -> /recipes
- Về chúng tôi -> /about
- FAQ -> /faq
- Search -> /products?q=<từ-khóa>

Footer và route bắt buộc:

/privacy
/terms
/shipping-policy
/returns
/contact
/track-order

Footer hiển thị thông tin liên hệ, chính sách, phương thức thanh toán và link social
thật nếu có; không tạo link giả.

Admin bổ sung:

/admin/categories: create, edit, deactivate category; quản lý name, slug, description,
image, imageAlt, sortOrder và active
/admin/reviews: duyệt, ẩn, xem source và verified purchase
/admin/customers: danh sách read-only tổng hợp theo normalized phone từ Order, không
cần bảng Customer riêng; chỉ role OWNER/ADMIN hợp lệ được xem PII
/admin/settings: thông tin cửa hàng, announcement, shipping, pending expiry và nhóm
Homepage gồm selector hero_product_id, featured_product_id và
homepage_best_seller_limit. Selector chỉ tìm/chọn Product active có ảnh chính và ít
nhất một variant active; hiển thị preview hero/triptych/banner trước khi lưu.

Search sản phẩm phải tìm theo name, slug và SKU bằng parameterized query. Product
list, Orders, Products, Reviews, Customers và AuditLog phải có pagination phía server,
page size mặc định 20 và tối đa 100; không tải toàn bộ dữ liệu một lần.

====================================================
45. REVIEW VÀ NỘI DUNG
====================================================

Review hiển thị trên homepage và product detail phải lấy từ database.

Phiên bản đầu không cho khách gửi review công khai nếu chưa có cơ chế xác minh
OrderItem. Review production không được bịa hoặc lấy demo seed. Review IMPORTED phải
có nguồn nội bộ được admin xác nhận và không gắn nhãn "Đã mua hàng"; chỉ Review có
orderItemId mới được gắn nhãn này.

Ingredients, usage, storageInstructions và thông tin thực phẩm trên Product Detail
phải lấy từ Product trong database. Related products ưu tiên cùng category, chỉ lấy
Product/Variant active còn hàng và loại trừ sản phẩm hiện tại.

IngredientStory và UsageGrid trên Homepage lấy từ Product featured,
ProductImage/ProductUsageSuggestion trong database. `content/home.ts` chỉ giữ label UI
trung tính và empty-state copy; không chứa tên thành phần, món ăn, claim hay review giả.

Trang recipes dùng nội dung MDX/type-safe local có title, slug, description, heroImage,
heroAlt, ingredients, steps và metadata. About/FAQ dùng nội dung tĩnh có chủ đích;
không để link hoặc button không hoạt động.

Mọi claim "organic", "tự nhiên", "không chất tạo màu", thông tin xuất xứ, hạn sử
dụng, nhà sản xuất/phân phối, cảnh báo dị ứng và dinh dưỡng phải có dữ liệu thật do
admin cung cấp. Không suy diễn hoặc hard-code claim chưa được xác minh.

====================================================
46. ERROR HANDLING VÀ OBSERVABILITY
====================================================

Tạo error boundary, not-found page, loading UI và empty state cho các route chính.

API phải phân biệt tối thiểu:

- 400 dữ liệu không hợp lệ
- 401 chưa đăng nhập
- 403 không có quyền hoặc DEMO_MODE_ORDER_DISABLED
- 404 không tồn tại
- 409 OUT_OF_STOCK, CHECKOUT_CHANGED, STALE_INVENTORY,
  INVALID_ORDER_TRANSITION, IDEMPOTENCY_KEY_REUSED hoặc IDEMPOTENCY_WINDOW_EXPIRED
- 429 vượt rate limit
- 500 lỗi hệ thống

Replay cùng idempotency key + cùng fingerprint trả HTTP 200 và replayed=true, không
phải 409.

Log server phải có request/correlation ID nhưng không chứa secrets hoặc PII đầy đủ.

Server tự tạo/validate request ID, trả X-Request-ID và propagate qua service. Không
tin trực tiếp request ID có độ dài/nội dung tùy ý từ client.

Mọi response chứa session, cart quote, order hoặc PII dùng dynamic rendering và:

Cache-Control: private, no-store, max-age=0
Vary: Cookie

Không log cookie, authorization, request body checkout, phone đầy đủ hoặc address.

Demo dùng Vercel Logs. Production cấu hình Sentry qua SENTRY_DSN với PII scrubbing,
environment và release. Alert tối thiểu cho 5xx, checkout failure rate, DB latency,
Blob failure và stock mismatch.

GET /api/health chỉ là liveness không query database, trả status/build version tối
thiểu và có public cache/rate cap để không thể giữ Neon thức. GET /api/readiness mới
query `SELECT 1`; endpoint này private, no-store, bắt buộc Bearer HEALTHCHECK_SECRET
hoặc admin session và rate limit tối đa 10 lần/phút/IP. Không endpoint nào trả secret,
connection string hoặc chi tiết schema.

Production cần runbook backup/restore Neon: xác định RPO tối đa 24 giờ, RTO tối đa
4 giờ, backup trước migration destructive và diễn tập restore tối thiểu mỗi quý.

Không được tuyên bố đạt RPO/RTO trên Neon Free nếu chưa có external encrypted backup
được test. Nếu không thiết lập được backup riêng, Production phải nâng Neon lên plan
có restore window phù hợp trước launch. Không lưu database backup trong PUBLIC Blob.

====================================================
47. TESTING VÀ ACCEPTANCE CRITERIA
====================================================

Tool bắt buộc:

- Vitest cho unit và integration test.
- React Testing Library cho component behavior.
- Playwright cho E2E.
- axe-core/Playwright cho accessibility automation.

Unit test tối thiểu cho:

- Tính subtotal, shipping và total.
- Validate quantity và stock.
- Order status transition.
- Order code generation.
- Session expiry.
- Zod input limit và shipping SiteSetting.
- Idempotency fingerprint.

Integration test tối thiểu cho:

- Product CRUD.
- Login/logout admin.
- Checkout lấy giá từ database.
- Atomic stock update và chống overselling.
- Idempotency khi tạo order.
- Hủy đơn và hoàn stock đúng một lần.
- Cùng key + cùng fingerprint replay 200; cùng key + fingerprint khác trả 409.
- Idempotency key hash ổn định không phụ thuộc secret; fingerprint dùng raw UUIDv4 làm
  HMAC key, bị xóa cùng PII và key cũ sau retention trả IDEMPOTENCY_WINDOW_EXPIRED.
- Hai POST đồng thời cùng key + payload chỉ tạo/trừ kho một lần; request còn lại đợi
  advisory transaction lock rồi replay 200, kể cả khi stock chỉ đủ một đơn.
- Hai checkout concurrent tranh lượng stock chỉ đủ cho một đơn.
- Hai cancel concurrent chỉ hoàn kho một lần.
- COD chỉ COMPLETED khi thu tiền/PAID; failed delivery, retry và RETURNED
  RESTOCKED/DISCARDED không hoàn kho lặp.
- Inventory expectedVersion cũ trả 409.
- PENDING hết hạn gọi cùng cancel service và hoàn kho; lazy-expiry không tranh chấp
  với daily Cron và test riêng SLA Demo 48–72 giờ.
- Admin login allow-list không tạo redirect loop.
- Order-access cookie đúng/sai/hết hạn/khác orderCode và vẫn xem được hai đơn đặt liên tiếp.
- Response PII có private, no-store.
- Shipping lấy SiteSetting và invalidation sau update.
- Checkout không bắt district và từ chối quote đã thay đổi.
- Rate-limit dùng bucket IP và target độc lập; reconcile/quote có cap 64 KiB/50 dòng.
- /api/health không query DB; /api/readiness cần quyền và rate limit.
- Asset LOCAL không gọi Blob delete; VERCEL_BLOB chỉ xóa sau khi mọi reference hết hạn.
- ProductImage role/focal point và ProductUsageSuggestion cùng Product được enforce;
  không xóa ảnh USAGE còn reference và không vượt 4 suggestion active.
- Deployment Demo không render/parse/lưu PII; create/track Order luôn trả
  DEMO_MODE_ORDER_DISABLED và không làm thay đổi database/stock.

E2E test tối thiểu cho:

- Browse -> chọn variant -> cart -> checkout -> order success.
- Refresh vẫn giữ cart.
- Admin login -> tạo/sửa product -> cập nhật trạng thái order -> logout.
- Người không đăng nhập không truy cập được admin.
- Không xem được thông tin order success khi thiếu quyền truy cập.
- Cart/checkout phục hồi đúng khi giá, stock hoặc variant thay đổi.
- Upload ảnh yêu cầu admin, kiểm size/type và chỉ xóa ảnh lịch sử OrderItem sau asset retention.
- Homepage render đúng dữ liệu động: hero/featured Product khác nhau, tên tiếng Việt
  dài, thiếu scene mobile, thiếu review, thiếu usage image và toàn bộ variant hết hàng.
- Không có account icon chết, review giả, claim chưa xác minh, chữ/giá/CTA baked trong ảnh.

Kiểm tra responsive tại toàn bộ breakpoint đã nêu và xác nhận không overflow ngang.

Playwright visual regression có baseline được review/commit tại tối thiểu:

- 1440x1600
- 1122x1402, cùng viewport với ảnh tham khảo
- 1024x1366
- 430x932
- 390x844
- 320x568

Acceptance visual: đúng thứ tự Hero -> USP -> EditorialTriptych -> Featured banner;
không chữ chồng packshot, không crop nhãn, caption Usage luôn thấy, ba card cân bằng ở
desktop, DOM order hợp lý trên mobile và zoom 200–400% không mất CTA. Pixel diff dùng
tolerance nhỏ cho font/image rendering nhưng không được che layout regression.

Test environment:

- Integration/E2E dùng Neon test branch/database riêng qua DATABASE_URL_TEST và
  DATABASE_URL_TEST_UNPOOLED.
- Guard reset/truncate phải connect target rồi đọc DatabaseEnvironmentGuard và chỉ
  tiếp tục khi environment=TEST, instanceId khớp TEST_DATABASE_INSTANCE_ID,
  instanceId khác PRODUCTION_DATABASE_INSTANCE_ID, NODE_ENV/VERCEL_ENV không phải
  production và ALLOW_TEST_DATABASE_RESET=true. Thiếu/mismatch bất kỳ điều kiện nào
  phải fail closed trước câu lệnh destructive; so sánh URL chỉ là kiểm tra phụ.
- Test concurrency dùng nhiều connection thật, không bọc toàn bộ suite trong một
  transaction giả.
- Blob đi qua adapter; CI/E2E mặc định dùng fake Blob, không được ghi/xóa Blob
  Production.
- Test migrate từ database rỗng và chạy seed hai lần để xác nhận idempotent.
- CI có test chứng minh guard từ chối DB mang nhãn PRODUCTION/PREVIEW, instanceId sai,
  env thiếu và test URL vô tình trỏ cùng host production.

CI gate bắt buộc:

npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run build

Playwright E2E chạy trên test/preview environment được cô lập.

Không hoàn thành dự án nếu bất kỳ CI gate hoặc test:e2e bắt buộc nào thất bại.

====================================================
48. ACCESSIBILITY VÀ SEO BỔ SUNG
====================================================

Mục tiêu WCAG 2.2 AA cho toàn bộ storefront và admin, không chỉ checkout:

- Điều hướng đầy đủ bằng bàn phím.
- Focus state rõ ràng.
- Label và error message liên kết đúng với input.
- Modal/cart drawer có focus trap và trả focus khi đóng.
- Ảnh có alt text phù hợp.
- Màu chữ và nút đạt độ tương phản.
- Hỗ trợ prefers-reduced-motion.
- Skip link, landmark và heading hierarchy hợp lệ.
- Icon-only button, hamburger và quantity +/- có accessible name.
- Toast, cart count và validation error dùng aria-live phù hợp.
- Drawer/modal đóng bằng Escape, focus trap và trả focus đúng trigger.
- Touch target tối thiểu 44x44 CSS pixels.
- Nội dung reflow được ở zoom 400% mà không mất chức năng.
- Rating có text thay thế đọc được bằng screen reader.

Chạy axe tự động cho các route chính và kiểm thử thủ công keyboard trên desktop/mobile.

Performance acceptance:

- Dùng next/image với sizes/srcset; hero LCP image dùng priority/preload đúng chỗ.
- Ảnh dưới fold lazy-load, không tải gallery full-size ngay lần đầu.
- Giữ Server Component mặc định và giới hạn JavaScript client không cần thiết.
- Mục tiêu Core Web Vitals p75: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1.
- Lighthouse mobile lab: Performance >= 85, Accessibility >= 90, SEO >= 90 trên
  dữ liệu seed và network profile chuẩn của CI.

SEO bổ sung:

- sitemap.xml
- robots.txt
- canonical URL
- Product và Breadcrumb JSON-LD
- OpenGraph image
- noindex cho cart, checkout, order success và toàn bộ admin

Mỗi Category active có landing page canonical /categories/[slug] với metadata,
description và Product active thuộc category. Sitemap chứa URL Product/Category active
cùng các trang nội dung public và lastModified. `/products?category=<slug>` redirect
308 sang category landing khi không có filter khác; URL search/sort/filter/pagination
còn lại noindex và canonical về /products hoặc category landing phù hợp, không tạo
duplicate index. Product/Category slug immutable sau lần publish đầu nên không tạo
broken URL hoặc cần redirect lịch sử.

Product JSON-LD phải phản ánh ProductVariant offers, giá, currency VND, availability
và AggregateRating chỉ khi có review production hợp lệ; không đưa DEMO review vào
structured data.

Locale mặc định vi-VN. Format tiền dùng Intl.NumberFormat("vi-VN", { currency:
"VND" }); ngày hiển thị Asia/Bangkok. Copy storefront dùng tiếng Việt nhất quán,
không trộn Search/Cart/Order Summary nếu không có chủ đích thương hiệu.

====================================================
49. ENVIRONMENT, MIGRATION VÀ VẬN HÀNH
====================================================

.env.example phải liệt kê tối thiểu:

DATABASE_URL
DATABASE_URL_UNPOOLED
DATABASE_URL_TEST
DATABASE_URL_TEST_UNPOOLED
TEST_DATABASE_INSTANCE_ID
PRODUCTION_DATABASE_INSTANCE_ID
DEPLOYMENT_MODE
COMMERCIAL_HOSTING_CONFIRMED
STORAGE_ADAPTER
SESSION_SECRET
ORDER_ACCESS_SECRET
RATE_LIMIT_SECRET
CRON_SECRET
HEALTHCHECK_SECRET
ADMIN_EMAIL
BLOB_READ_WRITE_TOKEN
NEXT_PUBLIC_SITE_URL
INITIAL_FREE_SHIPPING_THRESHOLD
INITIAL_DEFAULT_SHIPPING_FEE
INITIAL_PENDING_ORDER_EXPIRY_HOURS
INITIAL_ORDER_PII_RETENTION_DAYS
INITIAL_ORDER_ASSET_RETENTION_DAYS
SENTRY_DSN
ALLOW_TEST_DATABASE_RESET

Không ghi giá trị secret thật vào .env.example.

SESSION_SECRET, ORDER_ACCESS_SECRET, RATE_LIMIT_SECRET, CRON_SECRET và
HEALTHCHECK_SECRET là các key độc lập, random tối thiểu 32 bytes. Idempotency không
dùng server secret; raw UUIDv4 không được lưu hoặc log.

Environment validation chạy khi server khởi động/build phần cần thiết và fail fast
với thông báo tên biến thiếu, không in giá trị secret.

COMMERCIAL_HOSTING_CONFIRMED và SENTRY_DSN bắt buộc ở Production; optional ở Demo.
Test URL/TEST_DATABASE_INSTANCE_ID/ALLOW_TEST_DATABASE_RESET chỉ được dùng trong test
process. PRODUCTION_DATABASE_INSTANCE_ID là CI secret/reference bất biến dùng để từ
chối destructive target, không phải giá trị do test tự suy ra. BLOB token bắt buộc khi
STORAGE_ADAPTER=vercel-blob.

STORAGE_ADAPTER nhận fake, local hoặc vercel-blob. Production chỉ nhận vercel-blob;
CI dùng fake; local development dùng local hoặc fake.

DATABASE_URL dùng pooled hostname cho runtime. DATABASE_URL_UNPOOLED dùng direct
connection cho drizzle-kit migration/pg_dump/restore. Runtime DB role không có quyền
CREATE/DROP schema; migration role/credential tách riêng nếu Neon plan hỗ trợ.

Development, Preview và Production phải có database, credential và Blob scope tách
biệt. Bật Neon–Vercel integration tạo branch cho từng Preview nếu quota cho phép.
Tuyệt đối không cho Preview dùng Production DATABASE_URL hoặc Blob token.

Sau khi provision/clone database, operator chạy command owner-only
`npm run db:mark-environment -- <DEVELOPMENT|TEST|PREVIEW|PRODUCTION> <instanceId>`.
Command yêu cầu xác nhận explicit, không chạy trong build/seed và ghi đúng một row
DatabaseEnvironmentGuard. CI giữ PRODUCTION_DATABASE_INSTANCE_ID; test reset chỉ tin
nhãn/instanceId đọc từ database target theo mục 47, không tin tên branch do client gửi.

Migration SQL phải được commit vào repository. Không chạy migration/seed trong
next build, module import hoặc request runtime.

Production migration workflow:

1. Tạo restore point/backup hoặc Neon branch.
2. Chạy drift check.
3. Chạy npm run db:migrate đúng một lần bằng DATABASE_URL_UNPOOLED.
4. Chạy migration smoke test.
5. Deploy/promote application.
6. Migration phải backward-compatible theo expand/contract để rollback deployment
   không làm app cũ hỏng schema.

Seed phải idempotent, có thể chạy lại mà không tạo trùng category, product, variant,
image, usage suggestion hoặc setting. Admin tạo bằng script riêng; Production seed phải explicit và
không chạy tự động mỗi deployment.

README phải mô tả cách rotate session/order-access secret, DATABASE_URL, Blob token,
đổi admin password, chạy migration, seed, test, build, restore và rollback deployment.

Project phải commit package-lock.json, chốt Node.js LTS trong engines/.nvmrc, dùng
npm ci trong CI, và .gitignore toàn bộ .env* ngoại trừ .env.example.

Nếu ảnh tham khảo MOOR SPICE không được cung cấp trong workspace, tone màu,
typography và layout mô tả trong PLAN.md là source of truth; không được chặn việc
triển khai vì thiếu ảnh tham khảo.

====================================================
50. CACHE VÀ INVALIDATION
====================================================

Không cache:

- /checkout
- /order-success/**
- /track-order
- /admin/**
- auth/order/checkout/stock API
- mọi response chứa session hoặc PII

Các route trên dùng dynamic rendering và Cache-Control: private, no-store.

Public catalog được cache tối đa 60 giây và dùng tag:

- products
- product:<id>
- product-slug:<slug>
- category:<id>
- site-settings

Stock/availability endpoint luôn no-store. Checkout transaction luôn lấy dữ liệu
database mới nhất, không tin cache.

Sau database commit thành công:

- Product/Variant/Image/UsageSuggestion mutation invalidate products, product id,
  slug cũ/mới và category liên quan.
- Category mutation invalidate category và products.
- SiteSetting mutation invalidate site-settings, /, /cart và /checkout.
- Inventory/Order mutation invalidate product tag liên quan.

Chỉ invalidate sau commit. Lỗi invalidation phải log và TTL 60 giây là fallback.

====================================================
51. PRIVACY, CHÍNH SÁCH VÀ DỮ LIỆU THỰC PHẨM
====================================================

Checkout có checkbox bắt buộc xác nhận đã đọc Điều khoản, Chính sách quyền riêng tư,
Giao hàng và Đổi trả. Không tự động opt-in marketing.

Privacy page phải nói rõ dữ liệu thu thập, mục đích, thời gian lưu, kênh yêu cầu chỉnh
sửa/xóa và dữ liệu nào phải giữ do nghĩa vụ pháp lý. Danh sách processor phải phản ánh
đúng cấu hình đang chạy: Vercel/Vercel Blob, Neon, Sentry khi bật và mọi nhà cung cấp
email/analytics khác nếu được thêm; không hard-code danh sách thiếu processor.

SiteSetting order_pii_retention_days và order_asset_retention_days là nguồn retention
runtime. Giá trị bootstrap mặc định đều là 730 ngày tính từ finalizedAt; biến môi
trường tương ứng chỉ seed lần đầu và không override database. Business owner phải xác
nhận lại thời hạn PII/asset với yêu cầu pháp lý và thương mại thực tế trước Production.

Job anonymization sau retention phải:

- Giữ orderCode, trạng thái, số tiền, OrderItem snapshot và timestamps phục vụ báo cáo.
- Đặt email/note/requestFingerprint thành null; thay customerName, phone,
  phoneNormalized, addressLine và các label/code địa chỉ bắt buộc bằng giá trị không
  định danh "REDACTED" để giữ invariant NOT NULL. idempotencyKeyHash vẫn giữ unique;
  retry cũ nhận IDEMPOTENCY_WINDOW_EXPIRED.
- Khi quá order_asset_retention_days, đặt OrderItem.productImageUrl=null rồi mới cho
  phép cleanup Blob không còn reference.
- Ghi AuditLog actor=system.
- Không xóa Order/OrderItem tài chính khỏi database.

Chỉ Admin active có quyền phù hợp được xem PII. Customer list không có export hàng
loạt ở phiên bản đầu. Mọi access/export sau này phải audit.

Product thực phẩm phải hỗ trợ và hiển thị khi có dữ liệu:

- origin
- manufacturer / distributor
- shelfLife
- storageInstructions
- allergenWarning
- nutritionInfo
- ingredients

Không hiển thị claim organic/tự nhiên/không chất tạo màu nếu admin chưa nhập và xác
nhận nguồn. Nội dung demo phải có nhãn rõ ràng và không dùng làm quảng cáo Production.

====================================================
52. DEPLOYMENT MODE VÀ GIỚI HẠN GÓI FREE
====================================================

Environment bắt buộc:

DEPLOYMENT_MODE=demo hoặc production

DEMO MODE:

- Có thể dùng Vercel Hobby + Neon Free + Vercel Blob Hobby.
- Chỉ dùng cho development, portfolio, review nội bộ hoặc demo phi thương mại.
- Hiển thị banner "BẢN DEMO – KHÔNG TẠO ĐƠN MUA THẬT".
- Không quảng cáo bán hàng, không thu tiền, không fulfillment và không dùng dữ liệu
  khách thật.
- Server guard DEPLOYMENT_MODE=demo phải chặn POST /api/orders và /api/track-order
  trước khi parse/lưu body, trả 403 DEMO_MODE_ORDER_DISABLED. Không có flag client nào
  được bypass guard này trên Vercel.
- Checkout Demo không render input PII. Nó chỉ dùng fixture hư cấu cố định và mô phỏng
  kết quả ở client/static sample, không insert Order/OrderItem, không trừ stock và ghi
  rõ "không gửi dữ liệu". Reconcile/quote chỉ nhận variantId/quantity nên vẫn chạy thật.
- Integration/E2E tạo Order chỉ trong local/CI với test database đã qua
  DatabaseEnvironmentGuard, không mở persistence trên deployment Demo công khai.

PRODUCTION MODE:

- Website bán hàng thật, quảng bá sản phẩm, nhận đơn để kiếm lợi nhuận hoặc xử lý
  payment phải dùng Vercel Pro hoặc cao hơn theo Vercel Fair Use Guidelines.
- DEPLOYMENT_MODE=production yêu cầu COMMERCIAL_HOSTING_CONFIRMED=true; thiếu biến
  này phải fail build/startup. Đây là xác nhận vận hành thủ công rằng hosting plan
  hiện tại cho phép commercial use, không phải cơ chế tự phát hiện gói Vercel.
- Neon Free có thể dùng tạm khi dữ liệu/tải còn trong quota, nhưng phải theo dõi và
  nâng cấp khi gần giới hạn hoặc khi cần recovery/availability tốt hơn.

Mốc quota tham khảo tại ngày 2026-08-10, phải kiểm tra lại trước mỗi lần launch:

Vercel Hobby:

- 1,000,000 Edge Requests/tháng.
- 100 GB Fast Data Transfer/tháng.
- 4 CPU-hours Functions/tháng và 1,000,000 invocations/tháng.
- Function request/response body tối đa 4.5 MB.
- Cron tối đa một lần/ngày và có thể chạy vào bất kỳ thời điểm nào trong giờ đã chọn;
  vì vậy Demo chỉ cam kết reservation được quét trong khoảng 48–72 giờ.
- Không mua overage; vượt quota có thể bị pause tới kỳ reset.

Vercel Blob Hobby:

- 1 GB-month storage.
- 10,000 simple operations/tháng.
- 2,000 advanced operations/tháng.
- 10 GB Blob data transfer/tháng.

Neon Free:

- 100 CU-hours/project/tháng.
- 0.5 GB database storage/project.
- 5 GB public network egress/tháng.
- Compute scale-to-zero có thể tạo cold-start latency.

README phải link tới trang pricing/limits chính thức thay vì coi các số trên là cố
định. Thiết lập cảnh báo/quy trình kiểm tra usage hàng tuần ở Demo và hàng ngày ở
Production.

Official links phải có trong README:

- https://vercel.com/docs/limits/fair-use-guidelines
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/cron-jobs/usage-and-pricing
- https://vercel.com/docs/vercel-blob/usage-and-pricing
- https://neon.com/pricing
- https://neon.com/docs/connect/connection-pooling

Production checklist:

- Vercel plan hợp lệ cho commercial use.
- Domain, HTTPS và NEXT_PUBLIC_SITE_URL chính xác.
- Neon/Blob region gần Vercel Functions.
- Production DB/Blob tách Preview.
- Migration, smoke test và backup hoàn tất.
- Admin password đã tạo ngoài seed.
- Privacy/terms/shipping/returns đã có nội dung thật.
- Monitoring, alert và quota owner đã được chỉ định.

====================================================
53. API VÀ MUTATION CONTRACT
====================================================

Server Components đọc storefront trực tiếp qua service/repository server-only; không
gọi vòng qua HTTP API nội bộ.

Public Route Handlers:

- POST /api/cart/reconcile
- POST /api/checkout/quote
- POST /api/orders
- POST /api/track-order

Ở DEPLOYMENT_MODE=demo, server vẫn expose contract nhưng POST /api/orders và
/api/track-order luôn 403 trước khi đọc body; UI Demo không gửi PII. Ở Production mới
cho phép hai endpoint này sau validation/rate limit.

Admin authentication Route Handlers:

- POST /api/admin/auth/login
- POST /api/admin/auth/logout

Admin CRUD dùng Server Actions gọi chung service layer. Upload ảnh dùng:

- POST /api/admin/uploads/images

System route:

- GET /api/cron/daily-maintenance, chỉ chấp nhận Bearer CRON_SECRET
- GET /api/health, public liveness không truy cập database
- GET /api/readiness, chỉ chấp nhận Bearer HEALTHCHECK_SECRET hoặc admin session

Mọi API response dùng envelope:

{
 data: object | null,
 error: { code, message, fieldErrors? } | null,
 requestId: string
}

POST /api/orders:

- HTTP 201 cho lần tạo đầu.
- HTTP 200 + replayed=true cho idempotent replay cùng fingerprint.
- HTTP 409 IDEMPOTENCY_KEY_REUSED khi cùng key nhưng payload khác.
- HTTP 409 IDEMPOTENCY_WINDOW_EXPIRED khi key tồn tại nhưng fingerprint đã hết retention.
- HTTP 409 CHECKOUT_CHANGED/OUT_OF_STOCK kèm quote mới an toàn, không chứa dữ liệu
  nội bộ hoặc tồn kho của sản phẩm khác.

Mỗi Route Handler và Server Action tự authenticate/authorize/validate ở server,
gọi service dùng chung và không duplicate business rule giữa API với UI.
