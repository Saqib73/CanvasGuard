# Watermark backend functionality

- /api/upload-> when user uploads a file(return cloudinary url and public_id)
- /api/watermark-> when user clicks on watermark button(takes url and public_id and return updated url and public_id)
- /api/createPost-> inputs url and public_id + post details and create a post.

# Whole watermarking concept

- User uploads image → compute hash.
- If hash exists → compare to original metadata (original owner, signature).
- If it’s new → proceed with watermarking + upload to Cloudinary with metadata.
- If someone reports or re-uploads →
- Compute hash again.
- If matches → flag as duplicate, verify via invisible/visible watermark.

# Commissions

- Filter artists based on tags(+ location where they ship)
- User request someone for commission(click btn)(done)
- A form is shown with the request details(artstyle, description, deadline, character, any images)(done-> backend)
- The details are sent to the artist(maybe email), have a page for all requests + details, (done-> backend)
- If agree to take the commission, open a temporary chat(need to implement)
- Integrate some payment method(maybe razor pay)

# To Implement

- Customize the watermark
- Communities
