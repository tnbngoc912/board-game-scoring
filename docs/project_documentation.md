# Tài Liệu Kỹ Thuật Dự Án ScoreKeeper (Dành Cho AI)

Tài liệu này tổng hợp toàn bộ cấu trúc kiến trúc, nghiệp vụ, quản lý trạng thái, API và tiêu chuẩn thiết kế của dự án **ScoreKeeper**. Mục tiêu là giúp các AI/Subagents nhanh chóng nắm bắt dự án để phát triển tính năng hoặc sửa lỗi.

---

## 1. Tổng Quan & Công Nghệ (Tech Stack)

ScoreKeeper là một ứng dụng web di động (mobile-first) dùng để ghi và theo dõi điểm số các ván chơi board game.

*   **Framework**: Next.js 15 (sử dụng App Router làm SPA).
*   **Thư viện UI**: React 18.
*   **Quản lý trạng thái (State Management)**: Zustand.
*   **Hiệu ứng/Hoạt ảnh**: Framer Motion.
*   **Hệ thống Style**: Custom Vanilla CSS (sử dụng CSS Variables / Design Tokens).
*   **Tính năng bổ sung**: PWA (next-pwa) hỗ trợ chế độ offline, Google Fonts (Barlow Semi Condensed).
*   **Backend API**: Dự án API backend chạy song song nằm tại thư mục `/Users/luannguyen/BoardGameScoring/backend`. API cục bộ được cấu hình thông qua biến môi trường `NEXT_PUBLIC_API_BASE_URL` trong file `.env.local` (mặc định trỏ đến `http://localhost:5000/api/v1`).

---

## 2. Cấu Trúc Thư Mục (Project Structure)

```
src/
├── api/
│   └── backendService.js       # API Client & Chuẩn hóa dữ liệu đầu ra/vào
├── components/
│   ├── PlayerDot.jsx           # Avatar tròn đại diện người chơi
│   ├── GameCard.jsx            # Component hiển thị thẻ game/lịch sử ván đấu
│   ├── SetupScreen.jsx         # UI thiết lập game & chọn người chơi
│   ├── GameScreen.jsx          # UI chấm điểm ván đấu đang diễn ra
│   ├── GameOverviewScreen.jsx  # UI xem tổng quan game & bảng xếp hạng (Leaderboard)
│   ├── Leaderboard.jsx         # Bảng xếp hạng người chơi
│   ├── ScoreInput.jsx          # UI tăng/giảm điểm (nếu dùng)
│   ├── RoundHistory.jsx        # Lịch sử các vòng đấu dưới dạng bảng
│   ├── HistoryScreen.jsx       # UI xem lịch sử các ván đấu cũ và chi tiết
│   ├── LoadingOverlay.jsx      # Màn hình chờ tải dữ liệu
│   └── Toast.jsx               # Thông báo nổi (Notification toast)
├── store/
│   ├── appDataStore.js         # Lưu trữ cache dữ liệu dùng chung (games, users, history)
│   ├── authStore.js            # Trạng thái đăng nhập và thông tin cá nhân
│   └── gameStore.js            # Trạng thái ván đấu đang chơi cục bộ
├── hooks/
│   └── useToast.js             # Custom hook điều khiển Toast
├── app/
│   ├── forgot-password/page.jsx# Route quên mật khẩu
│   ├── game/page.jsx           # Route màn hình chơi game
│   ├── history/                # Route lịch sử ván đấu
│   │   ├── page.jsx            # Danh sách ván đấu
│   │   └── [id]/page.jsx       # Chi tiết một ván đấu cụ thể
│   ├── layout.jsx              # Next.js Root Layout (cấu hình fonts, metadata, viewport)
│   ├── manifest.js             # Cấu hình PWA Manifest
│   └── page.jsx                # SPA Client entry point (render App.jsx)
├── styles/                     # Thư mục chứa mã nguồn CSS mô-đun
│   ├── base/                   # reset.css, variables.css, typography.css
│   ├── components/             # button.css, card.css, loading.css, v.v.
│   ├── features/               # CSS riêng cho từng màn hình
│   ├── layout/                 # container.css, grid.css
│   ├── utils/                  # helpers.css, spacing.css
│   └── main.css                # Điểm tập hợp toàn bộ CSS
├── App.jsx                     # Shell chính điều phối màn hình & định tuyến Client-side
├── index.css                   # File CSS đầu vào của Next.js (import styles/main.css)
└── vercel.json                 # Cấu hình deploy Vercel
```

---

## 3. Quản Lý Trạng Thế (Zustand Stores)

Hệ thống quản lý trạng thái được chia làm 3 Store độc lập:

### 3.1. `useAuthStore` ([authStore.js](file:///Users/luannguyen/BoardGameClient/board-game-scoring/src/store/authStore.js))
Quản lý trạng thái đăng nhập của người dùng.
*   **Trạng thái**: `token` (JWT), `user` (profile người dùng hiện tại), `isAuthLoading` (đang xác thực), `hasBootstrapped` (đã khởi tạo kiểm tra token).
*   **Hành động chính**:
    *   `bootstrap()`: Chạy khi khởi động, đọc token từ localStorage và gọi API `/users/me` lấy profile. Nếu lỗi, xóa token.
    *   `login(email, password)`: Gọi API đăng nhập, lưu token và cập nhật profile.
    *   `logout()`: Xóa token khỏi localStorage và reset state.

### 3.2. `useAppDataStore` ([appDataStore.js](file:///Users/luannguyen/BoardGameClient/board-game-scoring/src/store/appDataStore.js))
Lưu trữ và cache các danh mục dùng chung lấy từ API. Có cơ chế Time-To-Live (TTL) để tránh gọi API quá nhiều.
*   **Cơ chế Cache**:
    *   `boardGames`: TTL = 5 phút.
    *   `users`: TTL = 5 phút.
    *   `history`: TTL = 30 giây.
*   **Hành động chính**:
    *   `fetchBoardGames({ force })`, `fetchUsers({ force })`, `fetchHistory({ force })`: Kiểm tra xem dữ liệu trong cache còn hạn (`isFresh()`) không. Nếu không, thực hiện gọi API để cập nhật dữ liệu.
    *   `invalidateBoardGames()`, `invalidateUsers()`, `invalidateHistory()`: Đặt thời điểm fetch về `0` để buộc lần gọi tiếp theo phải tải lại từ API.

### 3.3. `useGameStore` ([gameStore.js](file:///Users/luannguyen/BoardGameClient/board-game-scoring/src/store/gameStore.js))
Quản lý trạng thái của ván đấu đang thiết lập hoặc đang diễn ra cục bộ trên máy khách. Có lưu dự phòng trạng thái `darkMode`.
*   **Trạng thái**:
    *   `gameName`, `boardGameId`: ID và tên game được chọn.
    *   `gameFlow`: Trạng thái luồng chơi (`'overview'` | `'setup'` | `'entry'`).
    *   `scoringType`: Cách tính điểm của game (`'COLUMN_BASED'` | `'WINNER_ONLY'` | `'TOTAL_SCORE_ONLY'`).
    *   `players`: Danh sách người chơi tham gia ván đấu (gồm `id`, `name`, `apiUserId`, `color`, `avatar_url`).
    *   `categories`: Danh sách các cột điểm cần nhập (đối với COLUMN_BASED).
    *   `publishedScores`: Lưu bảng điểm hiện tại.
    *   `syncStatus`: Trạng thái đồng bộ lên server (`'idle'` | `'syncing'` | `'synced'` | `'offline'`).
*   **Hành động chính**:
    *   `selectGame(game)`: Khởi tạo thông tin game được chọn, reset các cột điểm `categories` phù hợp.
    *   `addPlayer(name, apiUserId, avatar)`: Thêm người chơi mới vào ván đấu cục bộ và tạo cấu trúc dòng điểm tương ứng.
    *   `publishScores(scoreRows, description)`:
        1. Đồng bộ hóa những người chơi tự nhập (chưa có `apiUserId`) lên database thông qua API `/users/sync` (sử dụng tên làm định danh, tự động tạo email ảo `<slugify(name)>@scorekeeper.local`).
        2. Đảm bảo game tồn tại trên server thông qua `ensureBoardGame`.
        3. Tạo ván đấu mới thông qua `createMatch`.
        4. Cập nhật kết quả điểm số (`playerScores` hoặc `winnerIds` tùy theo `scoringType`) qua `updateMatchScores`.
        5. Gọi invalidate các cache ở `useAppDataStore` để làm mới danh sách.

---

## 4. API & Chuẩn Hóa Dữ Liệu (`backendService.js`)

Mọi giao tiếp mạng đều đi qua [backendService.js](file:///Users/luannguyen/BoardGameClient/board-game-scoring/src/api/backendService.js).

### 4.1. Cơ chế hoạt động
*   Đầu đọc token JWT tự động được chèn vào header `Authorization: Bearer <token>` thông qua hàm `request()`.
*   Có các cơ chế normalize dữ liệu trả về từ API nhằm chuẩn hóa sự khác biệt giữa snake_case/nested object của Backend sang camelCase phẳng ở Frontend.

### 4.2. Các hàm chuẩn hóa quan trọng:
*   `normalizeBoardGame(game)`: Chuyển đổi cấu trúc `score_columns` hoặc `categories` thành danh sách cột điểm `categories`.
*   `normalizeMatch(match)`: Chuẩn hóa ván đấu hiển thị trên danh sách lịch sử. Xác định người thắng cuộc (`winner`) dựa trên `winner_ids` hoặc người có số điểm cao nhất. Định dạng ngày chơi sang `HH:MM - DD/MM/YYYY`.
*   `normalizeMatchDetail(payload)`: Chuẩn hóa chi tiết một ván đấu gồm danh sách người chơi chi tiết (`players`) xếp hạng từ cao xuống thấp và phân bổ điểm số của họ vào các hàng tương ứng (`scoreRows`).

---

## 5. Luồng Nghiệp Vụ Chính (Core Business Flows)

### 5.1. Xác thực người dùng (Auth) & Onboarding Nhóm
Nếu client chưa có token hoặc chưa đăng nhập:
1. [App.jsx](file:///Users/luannguyen/Working/boardgame/board-game-scoring/src/App.jsx) hiển thị màn hình Đăng nhập (`LoginScreen`) với tùy chọn chuyển đổi giữa **Đăng nhập** và **Đăng ký tài khoản mới**.
2. Sau khi đăng nhập/đăng ký thành công:
   - Hệ thống gọi `GET /api/v1/groups/my-groups` để kiểm tra các nhóm mà người dùng tham gia.
   - **Nếu chưa có nhóm nào**: Hiển thị màn hình **Onboarding** với 2 tùy chọn:
     * **Nhập mã mời nhóm**: Nhập mã mời để xin tham gia một nhóm có sẵn (trạng thái `PENDING` chờ Chủ nhóm duyệt).
     * **Tạo nhóm mới**: Đặt tên nhóm, hệ thống tạo nhóm và gán người dùng làm Chủ nhóm (`OWNER`).
   - **Nếu đã có nhóm**: Lưu `active_group_id` và đính kèm Header `X-Group-Id` vào toàn bộ các request tiếp theo.

### 5.2. Luồng Tủ Game của Nhóm & Thiết lập ván đấu (`SetupScreen`)
1. **Tủ game riêng của Nhóm**:
   - Khi một nhóm mới được tạo, Tủ game ban đầu sẽ **để trống**.
   - Chủ nhóm hoặc thành viên có quyền quản lý có thể:
     * **Thêm từ thư viện mẫu**: Mở modal duyệt danh mục game chuẩn toàn hệ thống (Global Catalog) để thêm vào tủ nhóm chỉ với 1 chạm.
     * **Tạo game nhanh**: Mở form đơn giản (Tên, Ảnh bìa, Số người chơi, Thời gian chơi). Hệ thống mặc định kiểu tính điểm là `TOTAL_SCORE_ONLY` (điểm tổng đơn giản, không cần cấu hình phe phái/cột phức tạp). Game tạo xong xuất hiện ngay trong Tủ game để nhóm chơi tức thì (đồng thời gửi yêu cầu duyệt lên System Admin để sau này được đưa vào Thư viện chung).
2. **Chọn game và thiết lập ván (`config`)**:
   - Chọn game từ Tủ game nhóm.
   - Thêm người chơi tham gia (từ danh sách thành viên nhóm hoặc bạn chơi ảo).
   - Chọn ngày giờ chơi và bấm "Tạo bảng điểm" để bắt đầu ghi điểm.

### 5.3. Luồng chấm điểm & Lưu kết quả (`GameScreen`)
Giao diện hiển thị bảng nhập điểm dựa vào `scoringType` của game được chọn:
* **`WINNER_ONLY`**: Hiển thị danh sách người chơi kèm checkbox người chiến thắng.
* **`TOTAL_SCORE_ONLY`**: Hiển thị bảng nhập 1 ô điểm tổng trực tiếp cho mỗi người chơi (đây là kiểu mặc định cho mọi game tạo nhanh).
* **`COLUMN_BASED`**: Hiển thị bảng nhiều cột điểm tương ứng với danh mục điểm của game. Tự động tính tổng điểm theo thời gian thực.

Khi nhấn "Lưu kết quả":
1. Gửi dữ liệu điểm lên API thông qua `publishScores`.
2. Hệ thống kiểm tra quyền `MATCH: CREATE` hoặc `MATCH: EDIT` của người dùng trong nhóm.
3. Sau khi lưu thành công, hệ thống tự động reset bảng điểm và chuyển hướng người dùng sang trang Lịch sử `/history`.

### 5.4. Xem và quản lý lịch sử ván đấu (`HistoryScreen`)
* Danh sách ván đấu được lọc cô lập theo nhóm hiện tại (`X-Group-Id`).
* Xem chi tiết ván đấu, danh sách điểm số và bình luận.
* Người dùng chỉ có thể xóa ván đấu nếu có quyền `MATCH: DELETE` được Chủ nhóm cấp.

### 5.5. Quản lý Thành viên Nhóm & Phân quyền
* **Lấy mã mời**: Hiển thị mã mời nhóm (`invite_code`) để Chủ nhóm gửi cho bạn bè.
* **Duyệt thành viên**: Tab "Chờ phê duyệt" hiển thị các yêu cầu gia nhập (`PENDING`) từ mã mời; Chủ nhóm bấm Duyệt (`ACTIVE`) hoặc Từ chối.
* **Phân quyền chi tiết**: Chủ nhóm có thể cấp/thu hồi quyền chi tiết cho từng thành viên: Xem (`READ`), Tạo trận (`CREATE`), Sửa điểm (`EDIT`), Xóa trận (`DELETE`). Thành viên mới vào nhóm mặc định chỉ có quyền Xem (`READ`).
* **Bạn chơi ảo (Virtual Player)**: Tạo người chơi ảo cho khách chơi vãng lai chưa có tài khoản, và hỗ trợ liên kết tài khoản thật sau này.
* **Xóa thành viên**: Xóa thành viên khỏi nhóm; nếu thành viên đã từng chơi ván đấu trong nhóm, hệ thống chuyển sang trạng thái `status: 'REMOVED'` để bảo toàn 100% dữ liệu lịch sử của nhóm.

### 5.6. Chỉnh sửa Hồ sơ cá nhân (`AccountScreen`)
* Người chơi có thể tự cập nhật **Tên hiển thị (`name`)** và tải lên **Ảnh đại diện (`avatar_url`)** mới thông qua Cloudflare R2 presigned URL và API `PATCH /api/v1/users/me`.

---

## 6. Hệ Thống Styling & Hướng Dẫn Thiết Kế (Design System)

Dự án áp dụng phong cách thiết kế **Rich Aesthetics** với các quy chuẩn:

### 6.1. Design Tokens ([variables.css](file:///Users/luannguyen/BoardGameClient/board-game-scoring/src/styles/base/variables.css))
*   **Bảng màu**: Sử dụng hệ màu đất ấm áp ấm cúng, sang trọng.
    *   `--color-bg`: Màu nền chính (`#f2e6dc`).
    *   `--color-card`: Màu nền thẻ (`#fffaf7`).
    *   `--color-brand`: Nâu hạt dẻ thương hiệu (`#93653f`).
    *   `--color-accent`: Vàng hổ phách nổi bật (`#f1a625`).
    *   `--color-success`: Xanh lá dịu (`#4caf67`).
    *   `--color-danger`: Đỏ gạch ấm (`#bb6250`).
*   **Kiểu chữ (Typography)**: Font Barlow Semi Condensed được cấu hình trên toàn bộ ứng dụng, với font-family chính `--font-main`.
*   **Bo góc (Radius)**: Các thành phần UI có độ bo góc mềm mại lớn (`--radius-xl: 22px`, `--radius-lg: 18px`).
*   **Chế độ sáng tối**: Sử dụng lớp `.theme-light` trên thẻ `<html>` để điều khiển đảo màu sắc.

### 6.2. Tiêu chuẩn thiết kế & CSS
*   Không sử dụng Tailwind CSS hay các thư viện CSS tiện ích ad-hoc.
*   Tách biệt CSS rõ ràng theo cấu trúc thư mục `src/styles`. Mọi CSS mới phải được khai báo trong file tương ứng và được import vào [main.css](file:///Users/luannguyen/BoardGameClient/board-game-scoring/src/styles/main.css).
*   Giao diện phải hoàn toàn thích ứng (Responsive) trên màn hình di động, sử dụng grid và flexbox linh hoạt.
*   Tránh sử dụng các màu cơ bản thô (như thuần đỏ, thuần xanh). Sử dụng hiệu ứng hover mượt mà và chuyển cảnh tinh tế để tăng trải nghiệm người dùng (Wow effect).

### 6.3. Component Button Tái Sử Dụng ([Button.jsx](file:///Users/luannguyen/BoardGameClient/board-game-scoring/src/components/ui/Button.jsx))
Component `Button` dùng chung được thiết kế đặc thù tối ưu cho giao diện di động (mobile-first), cung cấp trải nghiệm tương tác trực quan cao:
*   **Các Variants**:
    *   `primary`: Nền nâu thương hiệu (`--color-brand-600`), chữ trắng. Dùng cho các hành động chính (Lưu kết quả, Đăng nhập, Bắt đầu).
    *   `secondary`: Nền kem đào ấm (`--color-brand-100`), chữ nâu đậm (`--color-brand-700`). Dùng cho hành động phụ hoặc nổi bật vừa phải.
    *   `outline`: Nền trắng, viền xám nhạt (`--color-gray-12`), chữ đen xám (`--color-gray-80`). Dùng cho nút phụ hoặc nút trạng thái thường.
    *   `ghost`: Trong suốt, chữ nâu đậm (`--color-brand-700`). Dùng cho các liên kết hành động dạng văn bản hoặc nút icon tối giản.
*   **Props quan trọng**:
    *   `variant` (`'primary' | 'secondary' | 'outline' | 'ghost'`): Kiểu dáng nút.
    *   `size` (`'sm' | 'md' | 'lg'`): Kích thước nút (độ cao tương ứng `36px`, `48px`, `56px`).
    *   `leftIcon` / `rightIcon` (`ReactNode`): Icon hiển thị bên trái hoặc bên phải của chữ.
    *   `disabled` (`boolean`): Chặn click và tự động chuyển sang trạng thái disabled chuẩn Figma (Primary nền kem đào chữ mờ, Secondary nền kem hồng chữ cam đào mờ, Outline viền xám nhạt chữ xám mờ, Ghost chữ xám mờ).
*   **Tương tác Mobile-first**:
    *   **Loại bỏ Hover & Focus**: Tránh hiện tượng sticky hover trên di động.
    *   **Phản hồi chạm (Active State)**: Khi bấm xuống (`:active`), nút co lại nhẹ (`scale(0.98)`) kết hợp đổi màu nền sẫm/nhạt hơn một chút tùy theo variant để tạo cảm giác xúc giác phản hồi chân thực.
    *   **Đồng bộ Icon**: Hỗ trợ tự động ép màu các icon custom (`.custom-icon`) bên trong nút disabled kế thừa màu chữ `currentColor` tương ứng.

### 6.4. Component Input Tái Sử Dụng ([Input.jsx](file:///Users/luannguyen/BoardGameClient/board-game-scoring/src/components/ui/Input.jsx))
Component `Input` dùng chung giúp chuẩn hóa các trường nhập liệu trong ứng dụng với các tiêu chí tối ưu cho di động:
*   **Các Trạng Thái Thiết Kế**:
    *   **Normal**: Nền kem hồng nhạt (`--color-brand-50` / `#FFF9F5`), viền cam đào (`--color-brand-200` / `#F2BC95`).
    *   **Focus**: Nền giữ nguyên, viền chuyển sang màu nâu thương hiệu đậm (`--color-brand-600` / `#93653F`).
    *   **Disabled**: Nền xám nhạt (`--color-gray-8` / `#EDEBE9`), chữ và icon mờ đi (`opacity: 0.5`).
*   **Tính năng tích hợp**:
    *   `leftIcon` / `rightIcon` (`ReactNode`): Cho phép chèn icon linh hoạt phía trước hoặc phía sau trường nhập liệu (như icon tìm kiếm, icon email/mật khẩu, v.v.).
    *   `onClear` (`function`): Khi truyền callback này, một nút tròn xám chứa dấu **✕** sẽ tự động hiển thị bên phải khi trường nhập liệu có dữ liệu (và không bị disabled) giúp người dùng xóa nhanh giá trị chỉ với 1 chạm.
*   **Tương tác Mobile-first**:
    *   Loại bỏ hover và viền focus ring dư thừa bên ngoài để đảm bảo nét vẽ sắc nét và tối giản trên màn hình cảm ứng di động.

### 6.5. Component SearchBar Tích Hợp ([SearchBar.jsx](file:///Users/luannguyen/BoardGameClient/board-game-scoring/src/components/ui/SearchBar.jsx))
Component `SearchBar` tích hợp gom cụm ô nhập tìm kiếm, nút xóa nhanh (Clear) và nút lọc (Filter) thành một thanh nguyên khối đồng bộ theo thiết kế Figma:
*   **Thiết kế & Layout**:
    *   **Nền & Bóng đổ**: Sử dụng nền kem đục nhẹ (`var(--color-card-soft)`) và bóng đổ (`var(--shadow-card)`).
    *   **Bo góc tròn**: Bo góc lớn (`var(--radius-xl)` / `22px`) tạo giao diện nguyên khối mềm mại.
    *   **Đường kẻ dọc (Divider)**: Một đường kẻ dọc mảnh cao `24px` màu xám nhạt (`var(--color-gray-12)`) ngăn cách giữa phần tìm kiếm/clear và nút lọc bên phải.
*   **Props hỗ trợ**:
    *   `value` & `onChange`: Quản lý giá trị nhập liệu.
    *   `onClear`: Callback reset giá trị, tự động hiển thị nút tròn chứa dấu **✕** khi có dữ liệu.
    *   `isFilterOpen` & `onFilterToggle`: Trạng thái mở panel lọc và callback toggle.
    *   `hasFilters`: Trạng thái đang áp dụng lọc (nếu true, nút lọc tự động active).

---




## 7. Cấu Trúc Cơ Sở Dữ Liệu Backend (Tham Khảo)

Dự án Backend nằm tại thư mục `/Users/luannguyen/BoardGameScoring/backend` sử dụng MongoDB và Mongoose ORM. Dưới đây là các schema chính hỗ trợ đồng bộ:

### 7.1. BoardGame ([BoardGame.ts](file:///Users/luannguyen/BoardGameScoring/backend/src/models/BoardGame.ts))
*   `name`: Tên game.
*   `min_players` / `max_players`: Số người chơi tối thiểu và tối đa.
*   `scoring_type`: Kiểu tính điểm (`COLUMN_BASED` | `WINNER_ONLY` | `TOTAL_SCORE_ONLY`).
*   `score_columns`: Mảng các cột điểm (`id`, `name`, `type`, `icon_url`).

### 7.2. Match ([Match.ts](file:///Users/luannguyen/BoardGameScoring/backend/src/models/Match.ts))
*   `board_game_id`: ID của game (ref `BoardGame`).
*   `created_by`: ID người tạo (ref `User`).
*   `play_date`: Thời điểm chơi.
*   `player_count`: Số người tham gia.
*   `description`: Mô tả ván chơi.

### 7.3. MatchPlayer ([MatchPlayer.ts](file:///Users/luannguyen/BoardGameScoring/backend/src/models/MatchPlayer.ts))
*   `match_id`: ID ván chơi (ref `Match`).
*   `user_id`: ID người chơi (ref `User`).
*   `scores`: Map lưu trữ điểm số của từng cột điểm `{ [columnId]: scoreValue }`.
*   `total_score`: Tổng số điểm của người chơi đó.
*   `rank`: Thứ hạng trong ván.
*   `is_winner`: Đánh dấu là người chiến thắng.

