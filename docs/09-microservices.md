# Future Microservices Migration

## Target services

1. Authentication 2. User 3. Organization 4. Vendor 5. Product  
6. Category 7. Search 8. RFQ 9. Quotation 10. AI  
11. Document 12. Verification 13. Notification 14. Analytics  
15. SEO 16. Payment 17. Subscription 18. Communication

## Migration steps per module

1. Ensure all access via service interface (no cross-module DB joins in UI)
2. Publish OpenAPI for the module
3. Extract to service with shared auth middleware
4. Route via API gateway
5. Keep event contracts for async (RFQ invited, product published)

## Async (future)

Redis + BullMQ for AI jobs, email, indexing. Queue interface exists in monolith with in-process fallback.
