use std::{fs, path::{self, Path}};

fn text_name_get(directory_path:&Path) -> Vec<String>   {

     // 获取目录中的所有条目
     let entries = fs::read_dir(directory_path)
         .expect("Failed to read directory");
    
    //将readdir读取的文件名依次填入vec列表
    let mut vec: Vec<String> = Vec::new();

    //遍历entries,将每个元素填入vec
    for entry in entries {
        if let Ok(entry) = entry {
            let file_name = entry.file_name();
            vec.push(file_name.to_string_lossy().into_owned());
        }
    }
    vec

}