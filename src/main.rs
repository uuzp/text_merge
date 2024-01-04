use fltk::{prelude::*, *};
mod ui;

fn main() {
    let app = app::App::default();
    let mut ui = ui::UserInterface::make_window();
    let mut window = ui.w1.clone();
    let mut br = ui.br;
    
    app.run().unwrap();
}