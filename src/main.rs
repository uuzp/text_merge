use fltk::{prelude::*, *};
mod ui;

fn main() {
    let app = app::App::default();
    let window = ui::make_window();
    app.run().unwrap();
}