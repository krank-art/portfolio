## Testing forms

Test if comment upload form works correctly

```bash
curl -X POST http://localhost:8080/comments/upload.php \
  -F "username=JohnDoe" \
  -F "website=https://example.com" \
  -F "image=$(openssl rand -base64 32)" \
  -F "secret=mySecret"
```

```bash
curl -X POST http://localhost:8080/comments/upload.php \
  -F "username=JohnDoe" \
  -F "website=https://example.com" \
  -F "image=iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB2ElEQVR42mNgoBAwUqifZs+evWfOnIGBgYF4K5e3bp3r169el5++cURAgf+/ft3+PHj/+hQAfLy8v/+/fv3//nzz59/jmEYgPz58//9+9f/j+PHj///fPn/+gY8eOP//w4cP/X36//f37z58/n7GhoaGhsbw99+/f/wDKKjIxM/3///v3r16/v0aNHj/98+fLf8uXLh3yKZf379++fOnXq///37+/fv3+0Ehf7+/f99+vTpn+zZsycOTKZNmwYGBsbZtWuXAwAC5fv16+j/8+PHj35cuXWr0s/79+//8uXLd/Pnzx9v3745oZ2dXP7z589+fPXuWkpKSpmE1bdq0aUlJSUbZPnx4eu+++O6fExETe2NiYYWJidnX19fHjx09YWFhbmho6MbGxE0MDA3v//v3vQkhISEjPz8/f3p06f/z58///+TJkzdu3EhJSVGZmZk+fPl3WLVu2XFiYmHh+/frD2NjY/HFjYWFB+eHhYXpISUkhISEBZWVlZXV1dc8kPHDgQIF+/fq19evXn++9e/e/f//u3bt3QwEBAa2pqRkZGoqCgYGxsbGxsYJxQwMDAYYGBiYmJixT379+/vjx4/vHjx3/hwoW/+PHj4eDg8PDw4eDgQFVVVb8PPz8/Y2NhwcHBwe/fv/0ePHi0FBQVrXr1q2gFQAAOw==" \
  -F "secret=mySecret"
```
