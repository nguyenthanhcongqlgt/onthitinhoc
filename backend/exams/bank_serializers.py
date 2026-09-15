from rest_framework import serializers
from .models import QuestionCategory, BankQuestion, BankQuestionOption

class QuestionCategorySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = QuestionCategory
        fields = ['id', 'name', 'description', 'parent', 'created_by', 'created_by_name', 'created_at', 'updated_at', 'question_count']
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def get_question_count(self, obj):
        return obj.questions.count()


class BankQuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankQuestionOption
        fields = ['id', 'label', 'content', 'code_snippet', 'is_correct', 'order_index', 'explanation']


class BankQuestionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    options = BankQuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = BankQuestion
        fields = [
            'id', 'category', 'category_name', 'part_type', 'branch', 
            'content', 'code_snippet', 'code_language', 
            'competency_category', 'difficulty_level', 'explanation',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'options'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        options_data = self.initial_data.get('options', [])
        question = BankQuestion.objects.create(**validated_data)
        
        for index, opt_data in enumerate(options_data):
            BankQuestionOption.objects.create(
                bank_question=question,
                label=opt_data.get('label', ''),
                content=opt_data.get('content', ''),
                code_snippet=opt_data.get('code_snippet', ''),
                is_correct=opt_data.get('is_correct', False),
                order_index=opt_data.get('order_index', index + 1),
                explanation=opt_data.get('explanation', '')
            )
        return question

    def update(self, instance, validated_data):
        options_data = self.initial_data.get('options')
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if options_data is not None:
            instance.options.all().delete()
            for index, opt_data in enumerate(options_data):
                BankQuestionOption.objects.create(
                    bank_question=instance,
                    label=opt_data.get('label', ''),
                    content=opt_data.get('content', ''),
                    code_snippet=opt_data.get('code_snippet', ''),
                    is_correct=opt_data.get('is_correct', False),
                    order_index=opt_data.get('order_index', index + 1),
                    explanation=opt_data.get('explanation', '')
                )
                
        return instance
