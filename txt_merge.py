from os import getcwd,path,listdir
from sys import executable
from tkinter import BOTH, Listbox, filedialog, messagebox, simpledialog, ttk,Tk,END,SINGLE

def browse_directory():
    directory = filedialog.askdirectory(initialdir=getcwd(), title="Select Directory")
    if directory:
        dir_label.config(text=directory)
        update_file_list(directory)

def update_file_list(directory):
    all_txt_files = [f for f in listdir(directory) if f.endswith(".txt")]
    file_list.delete(0, END)
    for txt_file in all_txt_files:
        file_list.insert(END, txt_file)

def merge_files():
    directory = dir_label.cget("text")
    txt_files = list(file_list.get(0, END))

    merged_file_name = simpledialog.askstring("合并文件名", "请输入合并文件名称：")
    if not merged_file_name:
        merged_file_name = "merged_file"

    merged_file_path = path.join(directory, merged_file_name + ".txt")
    merged_file = open(merged_file_path, "w", encoding="utf-8")

    chapter_count = 1
    for txt_file in txt_files:
        file_path = path.join(directory, txt_file)
        file_name = path.splitext(txt_file)[0]
        merged_file.write(f"第{chapter_count}章 {file_name}\n")
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        merged_file.write(content + "\n\n")
        chapter_count += 1

    merged_file.close()
    messagebox.showinfo("Merge Complete", f"Files have been merged into {merged_file_path}")

# 创建 Tkinter 主窗口
root = Tk()
root.title("Text File Merger")
root.geometry("600x800")
root.iconbitmap(executable)
# 创建文件夹选择按钮
browse_button = ttk.Button(root, text="Browse Directory", command=browse_directory)
browse_button.pack(pady=10)

# 创建目录标签
dir_label = ttk.Label(root, text="No directory selected", font=("Arial", 12))
dir_label.pack(pady=5)

# 创建文件列表框
file_list = Listbox(root, selectmode=SINGLE, font=("Arial", 15), width=100, height=25)
file_list.pack(fill=BOTH, expand=True, pady=10, padx=20)

# 绑定拖拽事件
def drag_start(event):
    widget = event.widget
    widget.startPosition = widget.nearest(event.y)
    widget.selection_clear(0, END)
    widget.selection_set(widget.startPosition)

def drag_drop(event):
    widget = event.widget
    position = widget.nearest(event.y)
    item = widget.get(widget.startPosition)
    widget.delete(widget.startPosition)
    widget.insert(position, item)
    widget.selection_clear(0, END)

file_list.bind('<ButtonRelease-1>', drag_drop)
file_list.bind('<B1-Motion>', lambda e: 'break')
file_list.bind('<Button-1>', drag_start)

# 创建合并文件按钮
merge_button = ttk.Button(root, text="Merge Files", command=merge_files)
merge_button.pack(pady=5)

# 启动 Tkinter 事件循环
root.mainloop()