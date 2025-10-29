# Watermark backend functionality

- /api/upload-> when user uploads a file(return cloudinary url and public_id)
- /api/watermark-> when user clicks on watermark button(takes url and public_id and return updated url and public_id)
- /api/createPost-> inputs url and public_id + post details and create a post.

4. Putting it all together (conceptually)

User uploads image → compute hash.

If hash exists → compare to original metadata (original owner, signature).

If it’s new → proceed with watermarking + upload to Cloudinary with metadata.

If someone reports or re-uploads →

Compute hash again.

If matches → flag as duplicate, verify via invisible/visible watermark.
