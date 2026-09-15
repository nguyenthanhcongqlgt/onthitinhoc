from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'role', 'status',
            'phone_number', 'school', 'class_name', 'student_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        if user.status == User.Status.PENDING:
            raise serializers.ValidationError({
                "detail": "Tài khoản Giáo viên của bạn đang chờ Thầy Công (Super Admin) phê duyệt."
            })
        if user.status == User.Status.REJECTED:
            raise serializers.ValidationError({
                "detail": "Tài khoản của bạn đã bị từ chối truy cập. Vui lòng liên hệ Admin."
            })

        data['user'] = UserSerializer(user).data
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'full_name', 'role', 'phone_number', 'school', 'class_name', 'student_id'
        ]

    def validate_role(self, value):
        """Chặn leo quyền: chỉ cho phép đăng ký STUDENT hoặc TEACHER."""
        if value not in [User.Role.STUDENT, User.Role.TEACHER]:
            raise serializers.ValidationError("Không thể đăng ký với quyền này.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Mật khẩu xác nhận không khớp."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        role = validated_data.get('role', User.Role.STUDENT)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            role=role,
            phone_number=validated_data.get('phone_number', ''),
            school=validated_data.get('school', 'THPT Quất Lâm'),
            class_name=validated_data.get('class_name', ''),
            student_id=validated_data.get('student_id', '')
        )
        return user

class TeacherApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'status']
