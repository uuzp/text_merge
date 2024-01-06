use std::path::Path;

use fltk::{prelude::*, *};
mod ui;
mod text_file;

fn main() {
    let app = app::App::default();
    let mut ui = ui::UserInterface::make_window();
    let mut window = ui.w1.clone();
    let mut br = ui.br;
    //调用text_name_get函数，传入Path类型的变量
    let mut file_names = text_file::text_name_get(Path::new("./"));
    
    // Assuming `br` is a browser widget from the FLTK library
   
    for file_name in &file_names {
        br.add(&file_name,false);
    }

    // Add the browser widget to the window
    window.end();
    window.show();
    

    app.run().unwrap();
}