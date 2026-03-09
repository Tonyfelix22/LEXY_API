from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .registry import ReportRegistry
from .models import ReportExecution
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import json
import pandas as pd
import io

class ReportTypeListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        reports = ReportRegistry.get_all_reports()
        return Response(reports)

class ReportGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        report_name = request.data.get('report_name')
        parameters = request.data.get('parameters', {})
        file_format = request.data.get('format', 'JSON')

        try:
            strategy = ReportRegistry.get_strategy(report_name)
            
            # Generate data
            data = strategy.generate_data(parameters)

            # Save execution record
            execution = ReportExecution.objects.create(
                report_type=report_name,
                parameters=parameters,
                requested_by=request.user,
                status='COMPLETED',
                format=file_format
            )

            if file_format == 'JSON':
                return Response({"data": data, "execution_id": execution.id})
            
            elif file_format == 'EXCEL':
                # Simple Excel generation for now
                if isinstance(data, list):
                    df = pd.DataFrame(data)
                elif isinstance(data, dict) and 'summary' in data: # Handle Payroll Summary structure
                     df = pd.DataFrame([data['summary']])
                else:
                    df = pd.DataFrame([data]) # Fallback

                output = io.BytesIO()
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    df.to_excel(writer, index=False)
                
                file_name = f"reports/{report_name}_{execution.id}.xlsx"
                path = default_storage.save(file_name, ContentFile(output.getvalue()))
                execution.file_path = path
                execution.save()
                
                return Response({"file_url": default_storage.url(path), "execution_id": execution.id})

            return Response({"data": data, "execution_id": execution.id})

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
