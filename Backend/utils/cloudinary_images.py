import cloudinary
import cloudinary.uploader
import cloudinary.api
import os
import logging
from dotenv import load_dotenv

# ✅ Load environment variables from .env
load_dotenv()

# ✅ Ensure API credentials are loaded correctly
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
    raise ValueError("❌ Cloudinary API credentials are missing! Check your .env file.")

# ✅ Configure Cloudinary
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY, 
    api_secret=CLOUDINARY_API_SECRET
)

logging.info("✅ Cloudinary Config Loaded Successfully")

# ✅ Function to upload an image to Cloudinary
def upload_image(image_file, folder="profile_pictures"):
    """Uploads an image to Cloudinary and returns the image URL & public_id."""
    try:
        logging.info(f"🟢 Uploading {image_file.filename} to Cloudinary...")
        response = cloudinary.uploader.upload(image_file, folder=folder)
        logging.info(f"✅ Upload Successful: {response['secure_url']}")
        return {
            "secure_url": response["secure_url"],
            "public_id": response["public_id"]
        }
    except Exception as e:
        logging.error(f"❌ Error Uploading Image: {e}")
        return {"error": str(e)}

# ✅ Function to delete an image from Cloudinary
def delete_image(public_id):
    """Deletes an image from Cloudinary and returns True/False."""
    try:
        logging.info(f"🟢 Deleting image with public_id: {public_id}")
        response = cloudinary.uploader.destroy(public_id)

        if response.get("result") == "ok":
            logging.info("✅ Image Deleted Successfully")
            return True
        else:
            logging.warning(f"⚠️ Image Deletion Failed: {response}")
            return False
    except Exception as e:
        logging.error(f"❌ Error Deleting Image: {e}")
        return False
