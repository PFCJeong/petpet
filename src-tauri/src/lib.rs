// ============================================================
// 클릭 통과 (Click-through) 구현
// ============================================================
// 목표: 고양이 영역만 클릭 가능, 나머지는 클릭 통과
//
// 문제: set_ignore_cursor_events(true)하면 모든 클릭이 통과됨
// 해결: OS에서 마우스 위치를 직접 가져와서 고양이 위치와 비교
// ============================================================

use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::Manager;

// ⭐ macOS에서 마우스 위치 가져오기
use core_graphics::event::CGEvent;
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

// ⭐ 고양이 영역 정보 (프론트엔드에서 업데이트)
#[derive(Clone)]
struct PetBounds {
    x: f64,      // 고양이 중심 X
    y: f64,      // 고양이 중심 Y
    width: f64,  // 고양이 너비
    height: f64, // 고양이 높이
}

// ⭐ 전역 상태: Arc<Mutex>로 스레드 간 공유 가능
struct AppState {
    pet_bounds: Arc<Mutex<PetBounds>>,
}

// ⭐ 프론트엔드에서 호출: 고양이 위치 업데이트
#[tauri::command]
fn update_pet_bounds(state: tauri::State<AppState>, x: f64, y: f64, width: f64, height: f64) {
    let mut bounds = state.pet_bounds.lock().unwrap();
    bounds.x = x;
    bounds.y = y;
    bounds.width = width;
    bounds.height = height;
}

// ⭐ macOS에서 현재 마우스 위치 가져오기
fn get_mouse_position() -> Option<(f64, f64)> {
    let source = CGEventSource::new(CGEventSourceStateID::HIDSystemState).ok()?;
    let event = CGEvent::new(source).ok()?;
    let point = event.location();
    Some((point.x, point.y))
}

// ⭐ 마우스가 고양이 영역 안에 있는지 확인
fn is_mouse_over_pet(mouse_x: f64, mouse_y: f64, bounds: &PetBounds) -> bool {
    let half_w = bounds.width / 2.0;
    let half_h = bounds.height / 2.0;

    mouse_x >= bounds.x - half_w
        && mouse_x <= bounds.x + half_w
        && mouse_y >= bounds.y - half_h
        && mouse_y <= bounds.y + half_h
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // ⭐ Arc<Mutex>로 상태 생성 - 스레드와 Tauri 상태에서 모두 접근 가능
    let pet_bounds = Arc::new(Mutex::new(PetBounds {
        x: 0.0,
        y: 0.0,
        width: 128.0,  // 기본값 (64 * scale 2)
        height: 128.0,
    }));

    // ⭐ 스레드용 클론
    let pet_bounds_for_thread = Arc::clone(&pet_bounds);

    tauri::Builder::default()
        // ⭐ 전역 상태 등록
        .manage(AppState {
            pet_bounds: pet_bounds,
        })
        // ⭐ 프론트엔드에서 호출할 수 있는 커맨드 등록
        .invoke_handler(tauri::generate_handler![update_pet_bounds])
        .setup(move |app| {
            let window = app.get_webview_window("main").unwrap();
            let window_clone = window.clone();

            // ⭐ 스레드용 클론
            let bounds_ref = Arc::clone(&pet_bounds_for_thread);

            // ⭐ 백그라운드 스레드: 마우스 위치 주기적 체크
            thread::spawn(move || {
                let mut last_over_pet = false;

                loop {
                    // 16ms마다 체크 (약 60fps)
                    thread::sleep(Duration::from_millis(16));

                    // 마우스 위치 가져오기
                    if let Some((mouse_x, mouse_y)) = get_mouse_position() {
                        // 고양이 위치 가져오기
                        let bounds = bounds_ref.lock().unwrap().clone();

                        // 마우스가 고양이 위에 있는지 확인
                        let over_pet = is_mouse_over_pet(mouse_x, mouse_y, &bounds);

                        // 상태가 변경되었을 때만 업데이트 (불필요한 호출 방지)
                        if over_pet != last_over_pet {
                            last_over_pet = over_pet;

                            // 고양이 위 = 클릭 허용 (ignore = false)
                            // 고양이 밖 = 클릭 통과 (ignore = true)
                            let _ = window_clone.set_ignore_cursor_events(!over_pet);
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
