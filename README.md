# MOOR SPICE Product Catalog

Website giới thiệu sản phẩm **パスタマジックパウダー (Pasta Magic Powder)** bằng tiếng Nhật. Nội dung hiện dùng thông tin từ tài liệu sản phẩm: nguyên liệu, hướng dẫn làm pasta 5 bước và cách bảo quản.

Đây là catalog thông tin: **không có giỏ hàng, thanh toán, checkout, đơn hàng, tra cứu đơn hoặc dữ liệu khách hàng**. Admin chỉ quản lý sản phẩm, danh mục, ảnh, nội dung trang chủ và thông tin liên hệ/Facebook/Instagram.

## Chạy trên máy local

Yêu cầu Node.js 20.11 trở lên.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Catalog local được lưu ở `.data/catalog.json`; bản dữ liệu đi kèm để khởi tạo/khôi phục nằm ở `data/showcase-catalog.json`. Cả hai đã có sản phẩm Pasta Magic Powder.

Mở:

- Storefront: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

Để dùng Admin, đặt các biến sau trong `.env.local`:

```dotenv
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD_HASH=$2b$12$...
ADMIN_DISPLAY_NAME=Catalog Administrator
ADMIN_SESSION_VERSION=1
SESSION_SECRET=a-random-secret-at-least-32-bytes-long
RATE_LIMIT_SECRET=another-random-secret-at-least-32-bytes
```

Tạo bcrypt hash an toàn (mật khẩu không xuất hiện trên command line):

```powershell
npm run --silent admin:hash-password
```

## Render

Blueprint [render.yaml](./render.yaml) sử dụng **Render Starter + Persistent Disk** tại `/var/data` để lưu catalog JSON và ảnh tải lên. Khi Render khởi tạo disk trống, website tự copy `data/showcase-catalog.json` thành `/var/data/catalog.json` một lần, sau đó mọi cập nhật qua Admin sẽ được giữ lại.

Trên Render Free không có Persistent Disk: website vẫn có thể chạy bằng dữ liệu đóng gói, nhưng mọi thay đổi sản phẩm/ảnh từ Admin sẽ mất khi service khởi động lại hoặc deploy. Vì vậy dùng Starter nếu cần tự quản lý catalog sau khi deploy.

Thiết lập các biến Secret trên Render:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET` (ít nhất 32 bytes)
- `RATE_LIMIT_SECRET` (ít nhất 32 bytes)
- `HEALTHCHECK_SECRET` (tùy chọn, dùng cho `/api/readiness`)
- `NEXT_PUBLIC_SITE_URL` (URL HTTPS chính thức)

Không cần PostgreSQL, SQLite, Docker, `DATABASE_URL`, hay biến thanh toán/đơn hàng.

## Vercel

Nếu chưa cấu hình persistent backend, storefront trên Vercel tự dùng
`data/showcase-catalog.json` ở chế độ chỉ đọc để website vẫn hiển thị bình
thường. Admin chỉnh sửa catalog được khóa trong chế độ này.

Để lưu thay đổi từ Admin trên Vercel, cấu hình:

- `CATALOG_BACKEND=vercel-blob`
- `CATALOG_BLOB_READ_WRITE_TOKEN` cho kho JSON private
- `STORAGE_ADAPTER=vercel-blob`
- `BLOB_READ_WRITE_TOKEN` cho kho ảnh public
- `NEXT_PUBLIC_SITE_URL` bằng URL HTTPS production

## Dữ liệu và ảnh

- `CATALOG_BACKEND=local-json` dùng JSON file, phù hợp local và Render có disk.
- `STORAGE_ADAPTER=local` lưu ảnh ở `public/uploads` khi local hoặc Render có disk.
- Muốn dùng Vercel Blob thay cho file JSON: cấu hình `CATALOG_BACKEND=vercel-blob`, token private `CATALOG_BLOB_READ_WRITE_TOKEN`, và token public ảnh `BLOB_READ_WRITE_TOKEN` ở hai Blob store riêng.

Sao lưu/khôi phục catalog trước khi chỉnh sửa lớn:

```powershell
npm run catalog:export -- ../moon-spice-backups/catalog-backup.json
npm run catalog:import -- ../moon-spice-backups/catalog-backup.json --confirm
```

## Kiểm tra

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```
