# Product Taxonomy & Dynamic Attributes

## Hierarchy

```
Industry → Category → Subcategory → Third-level → Product → Variant
```

All levels configurable in Admin. No hard-coded category trees in application code.

## Category fields

name {en,ar}, description, image, icon, parentId, industryId, order, status, seo, attributeTemplateIds, filterKeys, validationRules

## Attribute types

text, textarea, number, decimal, boolean, dropdown, multi_select, radio, checkbox, date, range, measurement, currency, file, image, url

## Attribute flags

required, searchable, filterable, seoIndexable, adminOnly, vendorEditable, buyerVisible, label {en,ar}

## Filters

When a leaf category is selected, filters are generated from attributes with `filterable: true`.

## Completeness

Product completeness score weights: name, descriptions (en+ar), images, category, attributes, documents, SEO.
