[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$body = @{
    icount_doc_number = "8000"
    customer_name = [System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::GetBytes("דוד הלוי"))
    doc_type = [System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::GetBytes("הזמנת עבודה"))
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/api/debug/fix-order" -Method POST -Body $body -ContentType "application/json"
