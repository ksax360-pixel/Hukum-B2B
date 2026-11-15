# Database Schema

## Conventions

- All commercial text: `LocalizedString { en?: string; ar?: string }`
- Soft deletes via `deletedAt` where needed
- Audit via `AuditLog` for admin/sensitive mutations
- IDs: MongoDB ObjectId; public URLs use `slug.en` / `slug.ar`

## Core entities

### User
email, passwordHash, mobile, preferredLanguage, roles[], organizationId?, status, emailVerified, mfaEnabled

### Role / Permission
Role: key, name, permissions[]
Permission: resource, action (view|create|edit|delete|approve|reject|publish|export|manage|configure)

### Organization
name {en,ar}, type, members[{userId, role}], settings

### Vendor
ownerUserId, legalName {en,ar}, tradeName, companyType, crNumber, vatNumber, status, verificationStatus, industries[], categories[], locations[], completenessScore, seo, slug

### Buyer
userId, type (individual|company|procurement|enterprise), company, position, interests[]

### Industry / Category
Industry: name {en,ar}, slug, image, seo, status, order
Category: industryId, parentId?, level (1-3), name {en,ar}, slug, attributes[], filters[], seo, status, order

### Attribute / AttributeTemplate
key, label {en,ar}, type, required, searchable, filterable, options[], categoryIds[]

### Product
vendorId, sku, name {en,ar}, description {en,ar}, industryId, categoryPath[], brandId?, price, currency, priceType, moq, attributes{}, media[], documents[], status, verificationStatus, completenessScore, seo, aiMeta{}, slug

### RFQ / RFQItem / RFQVendor
RFQ: buyerId, organizationId?, status, deliveryLocation, deadline, budget, items[], invitedVendors[]
RFQVendor: rfqId, vendorId, status (invited|accepted|declined|quoted)

### Quotation
rfqId, vendorId, lines[], currency, totals, leadTime, paymentTerms, validity, status

### Document
ownerType, ownerId, type, fileUrl, version, expiryDate, verificationStatus, visibility

### Verification
entityType, entityId, status, steps[], notes, reviewedBy

### AIExtraction / AIContent / PromptTemplate
pipeline stage records, confidence, sourceDocumentId, humanVerified

### SEO
entityType, entityId, title {en,ar}, description {en,ar}, slug {en,ar}, keywords, og, schemaType, indexable

### Supporting
Conversation, Message, Notification, Subscription, Payment, Invoice, Review, SavedProduct, SavedVendor, SearchHistory, AnalyticsEvent, Location, Address, AuditLog, Brand, ProductVariant, CMS Page/Blog/FAQ

## Relationships

- Vendor 1—* Product
- Product *—1 Industry, *—1 Category (leaf), *—* Attributes
- Category tree via parentId
- RFQ *—* Vendor via RFQVendor
- Quotation → RFQ + Vendor
- Organization 1—* User (members)
