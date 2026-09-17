import os

files_to_check = []
for root, dirs, files in os.walk(r"d:\Kiểm tra trực tuyến\frontend\src"):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            files_to_check.append(os.path.join(root, file))

for file in files_to_check:
    if 'constants.ts' in file:
        continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    if 'THPT Quất Lâm' in content or 'Nam Định' in content or 'Ninh Bình' in content or 'Hệ thống Khảo thí' in content:
        # Check if we need to add import
        needs_import = False
        
        # Replace THPT Quất Lâm -> {SCHOOL_NAME}
        # But wait, it might be in strings or JSX text.
        # It's better to just manually replace the exact strings using replace_file_content or a robust regex.
        pass
