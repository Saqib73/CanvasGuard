from flask import Flask, request, send_file
from PIL import Image
import numpy as np
import io
import requests

app = Flask(__name__)

@app.post("/protect")
def protect():
    body = request.get_json()
    img_url = body["url"]
    
    # download image
    r = requests.get(img_url)
    img = Image.open(io.BytesIO(r.content)).convert("RGB")

    # extremely basic tiny perturbation (placeholder)
    # we’ll replace this later w/ stronger model based perturb
    arr = np.array(img).astype(np.float32)
    noise = np.random.normal(0, 1.5, arr.shape)   # slight gaussian noise
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)

    protected = Image.fromarray(arr)

    buf = io.BytesIO()
    protected.save(buf, format="PNG")
    buf.seek(0)

    return send_file(buf, mimetype='image/png')

if __name__ == "__main__":
    app.run(port=5001, debug=True)
