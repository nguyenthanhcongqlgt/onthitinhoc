from rest_framework import serializers
from .models import User, ClassRoom
from .serializers import UserSerializer


class ClassRoomSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    teacher_username = serializers.CharField(source='teacher.username', read_only=True)
    students_count = serializers.SerializerMethodField()
    grade_display = serializers.CharField(source='get_grade_display', read_only=True)

    class Meta:
        model = ClassRoom
        fields = [
            'id', 'name', 'code', 'grade', 'grade_display',
            'school_year', 'description', 'teacher', 'teacher_name',
            'teacher_username', 'students_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'code', 'teacher', 'created_at', 'updated_at']

    def get_students_count(self, obj) -> int:
        return obj.students.count()


class ClassRoomDetailSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    teacher_username = serializers.CharField(source='teacher.username', read_only=True)
    grade_display = serializers.CharField(source='get_grade_display', read_only=True)
    students = UserSerializer(many=True, read_only=True)
    students_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassRoom
        fields = [
            'id', 'name', 'code', 'grade', 'grade_display',
            'school_year', 'description', 'teacher', 'teacher_name',
            'teacher_username', 'students', 'students_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'code', 'teacher', 'created_at', 'updated_at']

    def get_students_count(self, obj) -> int:
        return obj.students.count()


class ManageClassStudentsSerializer(serializers.Serializer):
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text="Danh sách ID người dùng học sinh cần thêm vào lớp"
    )


class JoinClassByCodeSerializer(serializers.Serializer):
    code = serializers.CharField(
        max_length=20,
        required=True,
        help_text="Mã lớp học do giáo viên cung cấp"
    )
