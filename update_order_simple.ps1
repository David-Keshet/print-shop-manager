$body = @{
    icount_doc_number = "8000"
    customer_name = "David Levi"
    doc_type = "Work Order"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/debug/update-order" -Method POST -Body $body -ContentType "application/json"
