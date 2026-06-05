package com.datalake3auth

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Matrix
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.util.Log
import androidx.exifinterface.media.ExifInterface
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.face.FaceLandmark
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

class DataLakeCameraModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  private var pendingPromise: Promise? = null
  private var pendingVideoFile: File? = null
  private var pendingVideoFrameCount: Int = DEFAULT_VIDEO_FRAME_COUNT

  private val activityEventListener: ActivityEventListener =
    object : BaseActivityEventListener() {
      override fun onActivityResult(
        activity: Activity?,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
      ) {
        if (requestCode == REQUEST_CAPTURE_VIDEO) {
          handleVideoResult(resultCode, data)
        }
      }
    }

  init {
    reactContext.addActivityEventListener(activityEventListener)
  }

  override fun getName(): String = "DataLakeCamera"

  @ReactMethod
  fun captureVideo(durationMs: Double, frameCount: Double, promise: Promise) {
    val activity = currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "No active Android activity is available")
      return
    }

    if (pendingPromise != null) {
      promise.reject("CAPTURE_IN_PROGRESS", "A camera capture is already in progress")
      return
    }

    try {
      val videoFile = createCacheFile("datalake_face_video_", ".mp4")
      val framesDir = videoFile.parentFile ?: reactContext.getExternalFilesDir(null)
      val intent = Intent(activity, DataLakeVideoCaptureActivity::class.java).apply {
        putExtra(DataLakeVideoCaptureActivity.EXTRA_OUTPUT_PATH, videoFile.absolutePath)
        putExtra(DataLakeVideoCaptureActivity.EXTRA_FRAMES_DIR, framesDir?.absolutePath)
        putExtra(
          DataLakeVideoCaptureActivity.EXTRA_DURATION_MS,
          durationMs.toLong().coerceIn(1200L, 6000L),
        )
        putExtra(
          DataLakeVideoCaptureActivity.EXTRA_FRAME_COUNT,
          frameCount.toInt().coerceIn(1, 10),
        )
      }

      pendingPromise = promise
      pendingVideoFile = videoFile
      pendingVideoFrameCount = frameCount.toInt().coerceIn(1, 10)
      activity.startActivityForResult(intent, REQUEST_CAPTURE_VIDEO)
    } catch (error: Exception) {
      clearPending()
      promise.reject("VIDEO_CAPTURE_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun preprocessFace(
    imageUri: String,
    bounds: ReadableMap,
    targetSize: Double,
    promise: Promise
  ) {
    try {
      val decoded = decodeBitmap(imageUri)
      val bitmap = applyExifRotation(decoded, imageUri)
      val target = targetSize.toInt().coerceAtLeast(1)

      val faceX = bounds.getDouble("x").toFloat()
      val faceY = bounds.getDouble("y").toFloat()
      val faceWidth = bounds.getDouble("width").toFloat()
      val faceHeight = bounds.getDouble("height").toFloat()

      val padX = faceWidth * 0.25f
      val padY = faceHeight * 0.25f
      val left = max(0, floor((faceX - padX).toDouble()).toInt())
      val top = max(0, floor((faceY - padY).toDouble()).toInt())
      val right = min(bitmap.width, ceil((faceX + faceWidth + padX).toDouble()).toInt())
      val bottom = min(bitmap.height, ceil((faceY + faceHeight + padY).toDouble()).toInt())
      val cropWidth = max(1, right - left)
      val cropHeight = max(1, bottom - top)

      val cropped = Bitmap.createBitmap(bitmap, left, top, cropWidth, cropHeight)
      val scaled = Bitmap.createScaledBitmap(cropped, target, target, true)
      val plane = target * target
      val output = FloatArray(plane * 3)

      for (y in 0 until target) {
        for (x in 0 until target) {
          val pixel = scaled.getPixel(x, y)
          val idx = y * target + x
          output[idx] = (Color.red(pixel) / 127.5f) - 1.0f
          output[plane + idx] = (Color.green(pixel) / 127.5f) - 1.0f
          output[(2 * plane) + idx] = (Color.blue(pixel) / 127.5f) - 1.0f
        }
      }

      val result = Arguments.createArray()
      for (value in output) {
        result.pushDouble(value.toDouble())
      }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("PREPROCESS_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun detectFaces(imageUri: String, promise: Promise) {
    val detectorOptions = FaceDetectorOptions.Builder()
      .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
      .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
      .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
      .setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
      .setMinFaceSize(0.15f)
      .enableTracking()
      .build()

    val detector = FaceDetection.getClient(detectorOptions)

    try {
      val decoded = decodeBitmap(imageUri)
      val bitmap = applyExifRotation(decoded, imageUri)
      val image = InputImage.fromBitmap(bitmap, 0)

      detector.process(image)
        .addOnSuccessListener { faces ->
          try {
            val result = Arguments.createArray()
            for (face in faces) {
              result.pushMap(faceToMap(face))
            }
            Log.i(TAG, "Detected ${faces.size} face(s) in $imageUri")
            promise.resolve(result)
          } catch (error: Exception) {
            promise.reject("FACE_DETECTION_RESULT_FAILED", error.message, error)
          } finally {
            detector.close()
          }
        }
        .addOnFailureListener { error ->
          detector.close()
          promise.reject("FACE_DETECTION_FAILED", error.message, error)
        }
    } catch (error: Exception) {
      detector.close()
      promise.reject("FACE_DETECTION_SETUP_FAILED", error.message, error)
    }
  }

  private fun faceToMap(face: Face) =
    Arguments.createMap().apply {
      val rect = face.boundingBox
      val bounds = Arguments.createMap().apply {
        putDouble("x", rect.left.toDouble())
        putDouble("y", rect.top.toDouble())
        putDouble("width", rect.width().toDouble())
        putDouble("height", rect.height().toDouble())
      }

      val landmarks = Arguments.createArray()
      for (landmark in face.allLandmarks) {
        val position = Arguments.createMap().apply {
          putDouble("x", landmark.position.x.toDouble())
          putDouble("y", landmark.position.y.toDouble())
        }
        val landmarkMap = Arguments.createMap().apply {
          putString("type", landmarkTypeName(landmark.landmarkType))
          putMap("position", position)
        }
        landmarks.pushMap(landmarkMap)
      }

      putMap("bounds", bounds)
      putArray("landmarks", landmarks)
      putDouble("smilingProbability", (face.smilingProbability ?: -1f).toDouble())
      putDouble("leftEyeOpenProbability", (face.leftEyeOpenProbability ?: -1f).toDouble())
      putDouble("rightEyeOpenProbability", (face.rightEyeOpenProbability ?: -1f).toDouble())
      putDouble("headEulerAngleX", face.headEulerAngleX.toDouble())
      putDouble("headEulerAngleY", face.headEulerAngleY.toDouble())
      putDouble("headEulerAngleZ", face.headEulerAngleZ.toDouble())
      face.trackingId?.let { putInt("trackingId", it) }
    }

  private fun landmarkTypeName(type: Int): String =
    when (type) {
      FaceLandmark.MOUTH_BOTTOM -> "mouth_bottom"
      FaceLandmark.MOUTH_RIGHT -> "mouth_right"
      FaceLandmark.MOUTH_LEFT -> "mouth_left"
      FaceLandmark.RIGHT_EYE -> "right_eye"
      FaceLandmark.LEFT_EYE -> "left_eye"
      FaceLandmark.RIGHT_EAR -> "right_ear"
      FaceLandmark.LEFT_EAR -> "left_ear"
      FaceLandmark.RIGHT_CHEEK -> "right_cheek"
      FaceLandmark.LEFT_CHEEK -> "left_cheek"
      FaceLandmark.NOSE_BASE -> "nose_base"
      else -> "unknown_$type"
    }

  private fun handleVideoResult(resultCode: Int, data: Intent?) {
    val promise = pendingPromise
    val videoFile = pendingVideoFile
    val frameCount = pendingVideoFrameCount
    clearPending()

    if (promise == null) return

    if (resultCode != Activity.RESULT_OK) {
      val message = data?.getStringExtra(DataLakeVideoCaptureActivity.EXTRA_ERROR)
        ?: "Video capture was cancelled"
      promise.reject("VIDEO_CAPTURE_CANCELLED", message)
      return
    }

    if (videoFile == null || !videoFile.exists() || videoFile.length() == 0L) {
      promise.reject("VIDEO_EMPTY_RESULT", "Camera did not return a saved video")
      return
    }

    try {
      val previewFrameUris =
        data?.getStringArrayListExtra(DataLakeVideoCaptureActivity.EXTRA_FRAME_URIS)
          ?.filter { it.isNotBlank() }
          ?: emptyList()
      val frameUris = if (previewFrameUris.isNotEmpty()) {
        Log.i(TAG, "Using ${previewFrameUris.size} preview-sampled frame(s)")
        previewFrameUris
      } else {
        Log.w(TAG, "No preview-sampled frames returned; falling back to video decoding")
        extractVideoFrames(videoFile, frameCount)
      }
      if (frameUris.isEmpty()) {
        promise.reject("VIDEO_FRAME_EXTRACTION_FAILED", "No frames could be extracted from video")
        return
      }

      val result = Arguments.createMap()
      val frames = Arguments.createArray()
      for (uri in frameUris) frames.pushString(uri)

      result.putString("videoUri", Uri.fromFile(videoFile).toString())
      result.putArray("frameUris", frames)
      result.putDouble(
        "durationMs",
        data?.getLongExtra(DataLakeVideoCaptureActivity.EXTRA_DURATION_MS, 0L)?.toDouble()
          ?: 0.0,
      )
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("VIDEO_PROCESSING_FAILED", error.message, error)
    }
  }

  private fun extractVideoFrames(videoFile: File, frameCount: Int): List<String> {
    val retriever = MediaMetadataRetriever()
    val frameUris = mutableListOf<String>()

    try {
      retriever.setDataSource(videoFile.absolutePath)
      val durationMs = retriever
        .extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
        ?.toLongOrNull()
        ?: 0L
      val rotationDegrees = retriever
        .extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)
        ?.toIntOrNull()
        ?: 0
      val durationUs = max(durationMs * 1000L, 1_000_000L)

      Log.i(
        TAG,
        "Extracting $frameCount frame(s) from ${videoFile.name}, duration=${durationMs}ms, rotation=$rotationDegrees",
      )

      for (index in 0 until frameCount) {
        val timeUs = durationUs * (index + 1L) / (frameCount + 1L)
        val rawBitmap = retriever.getFrameAtTime(
          timeUs,
          MediaMetadataRetriever.OPTION_CLOSEST,
        ) ?: continue
        val bitmap = normalizeVideoFrame(rawBitmap, rotationDegrees)

        val frameFile = createCacheFile("datalake_video_frame_${index}_", ".jpg")
        FileOutputStream(frameFile).use { output ->
          bitmap.compress(Bitmap.CompressFormat.JPEG, 92, output)
        }
        Log.i(
          TAG,
          "Saved frame $index ${bitmap.width}x${bitmap.height} to ${frameFile.name}",
        )
        frameUris.add(Uri.fromFile(frameFile).toString())
      }
    } finally {
      retriever.release()
    }

    return frameUris
  }

  private fun rotateBitmap(bitmap: Bitmap, degrees: Int): Bitmap {
    val normalized = ((degrees % 360) + 360) % 360
    if (normalized == 0) return bitmap

    val matrix = Matrix()
    matrix.postRotate(normalized.toFloat())
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
  }

  private fun normalizeVideoFrame(bitmap: Bitmap, metadataRotation: Int): Bitmap {
    val rotated = rotateBitmap(bitmap, metadataRotation)
    if (rotated.height >= rotated.width) return rotated

    // Some Android camera stacks record portrait video frames as landscape
    // bitmaps without a useful rotation tag. ML Kit receives the JPEG only, so
    // save the extracted frame upright before passing it to JS.
    return rotateBitmap(rotated, 90)
  }

  private fun createCacheFile(prefix: String, suffix: String): File {
    val baseDir = reactContext.getExternalFilesDir(null) ?: reactContext.cacheDir
    val cameraDir = File(baseDir, "camera")
    if (!cameraDir.exists()) cameraDir.mkdirs()
    return File.createTempFile(prefix, suffix, cameraDir)
  }

  private fun clearPending() {
    pendingPromise = null
    pendingVideoFile = null
    pendingVideoFrameCount = DEFAULT_VIDEO_FRAME_COUNT
  }

  private fun decodeBitmap(imageUri: String): Bitmap {
    val uri = Uri.parse(imageUri)
    val stream = if (uri.scheme == "file") {
      FileInputStream(File(requireNotNull(uri.path)))
    } else {
      reactContext.contentResolver.openInputStream(uri)
    } ?: throw IllegalArgumentException("Unable to open image: $imageUri")

    stream.use {
      return BitmapFactory.decodeStream(it)
        ?: throw IllegalArgumentException("Unable to decode image: $imageUri")
    }
  }

  private fun applyExifRotation(bitmap: Bitmap, imageUri: String): Bitmap {
    val uri = Uri.parse(imageUri)
    val path = uri.path ?: return bitmap
    val orientation = try {
      ExifInterface(path).getAttributeInt(
        ExifInterface.TAG_ORIENTATION,
        ExifInterface.ORIENTATION_NORMAL
      )
    } catch (_: Exception) {
      ExifInterface.ORIENTATION_NORMAL
    }

    val degrees = when (orientation) {
      ExifInterface.ORIENTATION_ROTATE_90 -> 90f
      ExifInterface.ORIENTATION_ROTATE_180 -> 180f
      ExifInterface.ORIENTATION_ROTATE_270 -> 270f
      else -> 0f
    }

    if (degrees == 0f) return bitmap
    val matrix = Matrix()
    matrix.postRotate(degrees)
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
  }

  companion object {
    private const val TAG = "DataLakeCamera"
    private const val REQUEST_CAPTURE_VIDEO = 7104
    private const val DEFAULT_VIDEO_FRAME_COUNT = 6
  }
}
