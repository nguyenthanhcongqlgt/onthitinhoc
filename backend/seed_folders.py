# -*- coding: utf-8 -*-
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from exams.models import ExamFolder, Exam
from authentication.models import User

def seed_default_folders():
    admin_user = User.objects.filter(role=User.Role.ADMIN).first() or User.objects.filter(is_superuser=True).first()
    
    default_folders = [
        {
            'name': 'Bài kiểm tra khối 10',
            'description': 'Các bài kiểm tra thường xuyên, định kỳ và chuyên đề Tin học Khối 10',
            'color': 'blue',
            'icon': 'book',
            'is_shared': True,
            'order_index': 1
        },
        {
            'name': 'Bài kiểm tra khối 11',
            'description': 'Các bài kiểm tra thường xuyên, định kỳ và chuyên đề Tin học Khối 11',
            'color': 'emerald',
            'icon': 'book',
            'is_shared': True,
            'order_index': 2
        },
        {
            'name': 'Bài kiểm tra khối 12',
            'description': 'Các bài kiểm tra thường xuyên, định kỳ và chuyên đề Tin học Khối 12',
            'color': 'amber',
            'icon': 'book',
            'is_shared': True,
            'order_index': 3
        },
        {
            'name': 'Bài kiểm tra ôn HSG',
            'description': 'Đề thi học sinh giỏi các cấp, đề ôn luyện chuyên đề bồi dưỡng HSG',
            'color': 'purple',
            'icon': 'trophy',
            'is_shared': True,
            'order_index': 4
        },
        {
            'name': 'Bài kiểm tra Dành cho ôn tốt nghiệp',
            'description': 'Đề ôn thi Tốt nghiệp THPT bám sát cấu trúc đề minh họa Bộ GD&ĐT',
            'color': 'cyan',
            'icon': 'graduation-cap',
            'is_shared': True,
            'order_index': 5
        },
    ]

    folder_map = {}
    for f_data in default_folders:
        folder, created = ExamFolder.objects.get_or_create(
            name=f_data['name'],
            parent=None,
            defaults={
                'description': f_data['description'],
                'color': f_data['color'],
                'icon': f_data['icon'],
                'is_shared': True,
                'creator': admin_user,
                'order_index': f_data['order_index']
            }
        )
        folder_map[folder.name] = folder

    hsg_folder = folder_map.get('Bài kiểm tra ôn HSG')
    tn_folder = folder_map.get('Bài kiểm tra Dành cho ôn tốt nghiệp')

    exams_without_folder = Exam.objects.filter(folder__isnull=True)
    mapped_count = 0
    for exam in exams_without_folder:
        if exam.exam_type == Exam.ExamType.HSG and hsg_folder:
            exam.folder = hsg_folder
            exam.save(update_fields=['folder'])
            mapped_count += 1
        elif exam.exam_type == Exam.ExamType.TN_THPT and tn_folder:
            exam.folder = tn_folder
            exam.save(update_fields=['folder'])
            mapped_count += 1

    print(f"Folders verified. Mapped {mapped_count} existing exams.")

if __name__ == '__main__':
    seed_default_folders()
