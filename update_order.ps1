$body = @{
    icount_doc_number = "8000"
    customer_name = "דוד הלוי"
    doc_type = "הזמנת עבודה"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/debug/update-order" -Method POST -Body $body -ContentType "application/json"
