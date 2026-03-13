# Article Board - Supabase Integration

## Setup

### 1. Create the Articles Table

Run the SQL schema in your Supabase SQL Editor:

```bash
# Copy the schema
cat articles-schema.sql
```

Then paste into Supabase dashboard → SQL Editor → New Query → Run

### 2. Environment Variables

Make sure these are set in your `.env.local`:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
LETTERMAN_API_KEY=your_letterman_key
```

## Usage

### Fetch Articles (from Database)

```
GET /api/articles
```

Returns articles stored in Supabase (fast, no external API calls).

### Sync from Letterman

```
GET /api/articles?sync=true
```

Fetches fresh articles from Letterman API and stores them in Supabase.

### Force Refresh (alias for sync)

```
GET /api/articles?refresh=true
```

Same as `sync=true` - re-fetches from Letterman.

## Article Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT | Primary key (Letterman article ID) |
| `title` | TEXT | Article title |
| `publication` | TEXT | Publication name |
| `publication_id` | TEXT | Publication ID |
| `status` | TEXT | Article state (draft, approved, published, rejected) |
| `image_url` | TEXT | Preview/thumbnail image URL |
| `seo_title` | TEXT | SEO optimized title |
| `seo_description` | TEXT | SEO meta description |
| `url_path` | TEXT | Article URL slug |
| `content` | TEXT | Full article content (optional) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |
| `letterman_data` | JSONB | Full Letterman API response |

## Workflow

1. **Initial Sync:** Call `/api/articles?sync=true` to populate the database
2. **Normal Usage:** Call `/api/articles` to fetch from database
3. **Periodic Sync:** Re-run sync periodically to get new articles from Letterman
4. **Approve/Reject:** Use existing approve/reject endpoints (they'll update Supabase too)

## Benefits

- **Fast:** No waiting for Letterman API on every page load
- **Offline:** Works even if Letterman API is down
- **Rich Data:** Store additional metadata (SEO fields, content, etc.)
- **Searchable:** Can add full-text search, filters, etc.
- **Auditable:** Track article history and changes

## Next Steps

- [ ] Run the SQL schema in Supabase
- [ ] Test `/api/articles?sync=true` to populate initial data
- [ ] Update approve/reject endpoints to also update Supabase
- [ ] Add pagination for large article lists
- [ ] Implement article detail view with full content
