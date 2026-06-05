package com.datalake3auth

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.RectF
import android.graphics.SurfaceTexture
import android.graphics.drawable.GradientDrawable
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraMetadata
import android.hardware.camera2.CaptureRequest
import android.media.MediaRecorder
import android.os.Bundle
import android.os.Handler
import android.os.HandlerThread
import android.util.Log
import android.util.Size
import android.view.Gravity
import android.view.Surface
import android.view.TextureView
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import java.io.File
import java.io.FileOutputStream
import kotlin.math.max

class DataLakeVideoCaptureActivity : Activity() {
  private lateinit var textureView: TextureView
  private lateinit var statusText: TextView
  private lateinit var progressBar: ProgressBar

  private var cameraDevice: CameraDevice? = null
  private var captureSession: CameraCaptureSession? = null
  private var mediaRecorder: MediaRecorder? = null
  private var backgroundThread: HandlerThread? = null
  private var backgroundHandler: Handler? = null
  private var mainHandler = Handler()

  private lateinit var cameraId: String
  private lateinit var previewSize: Size
  private lateinit var outputFile: File
  private lateinit var framesDir: File
  private var durationMs: Long = DEFAULT_DURATION_MS
  private var frameCount: Int = DEFAULT_FRAME_COUNT
  private var sensorOrientation: Int = 90
  private var lensFacingFront: Boolean = true
  private var isRecording = false
  private var stopRequested = false
  private var nextSampleIndex = 0
  private val sampledFrameUris = arrayListOf<String>()

  private val surfaceTextureListener = object : TextureView.SurfaceTextureListener {
    override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
      openCamera(width, height)
    }

    override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) {
      if (::previewSize.isInitialized) configureTransform(width, height)
    }

    override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean = true
    override fun onSurfaceTextureUpdated(surface: SurfaceTexture) = Unit
  }

  private val stateCallback = object : CameraDevice.StateCallback() {
    override fun onOpened(camera: CameraDevice) {
      cameraDevice = camera
      startRecordingSession()
    }

    override fun onDisconnected(camera: CameraDevice) {
      camera.close()
      cameraDevice = null
      finishWithError("Camera disconnected")
    }

    override fun onError(camera: CameraDevice, error: Int) {
      camera.close()
      cameraDevice = null
      finishWithError("Camera error: $error")
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

    val outputPath = intent.getStringExtra(EXTRA_OUTPUT_PATH)
    if (outputPath.isNullOrBlank()) {
      finishWithError("No output path supplied")
      return
    }

    outputFile = File(outputPath)
    framesDir = File(
      intent.getStringExtra(EXTRA_FRAMES_DIR) ?: outputFile.parent ?: cacheDir.absolutePath,
    )
    if (!framesDir.exists()) framesDir.mkdirs()
    framesDir.listFiles()
      ?.filter { it.name.startsWith("datalake_preview_frame_") }
      ?.forEach { it.delete() }

    durationMs = intent.getLongExtra(EXTRA_DURATION_MS, DEFAULT_DURATION_MS)
      .coerceIn(1200L, 6000L)
    frameCount = intent.getIntExtra(EXTRA_FRAME_COUNT, DEFAULT_FRAME_COUNT)
      .coerceIn(1, 12)

    if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
      finishWithError("Camera permission is missing")
      return
    }

    buildLayout()
  }

  override fun onResume() {
    super.onResume()
    startBackgroundThread()

    if (textureView.isAvailable) {
      openCamera(textureView.width, textureView.height)
    } else {
      textureView.surfaceTextureListener = surfaceTextureListener
    }
  }

  override fun onPause() {
    if (!stopRequested) {
      stopRecording(cancelled = true)
    }
    closeCamera()
    stopBackgroundThread()
    super.onPause()
  }

  private fun buildLayout() {
    val root = FrameLayout(this).apply {
      setBackgroundColor(Color.BLACK)
    }

    textureView = TextureView(this)
    root.addView(
      textureView,
      FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      ),
    )

    val shade = GradientDrawable(
      GradientDrawable.Orientation.TOP_BOTTOM,
      intArrayOf(0x99000000.toInt(), 0x11000000, 0x99000000.toInt()),
    )
    val overlay = FrameLayout(this).apply { background = shade }
    root.addView(
      overlay,
      FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      ),
    )

    val title = TextView(this).apply {
      text = "Face Video Capture"
      setTextColor(Color.WHITE)
      textSize = 22f
      setTypeface(typeface, android.graphics.Typeface.BOLD)
    }
    val titleParams = FrameLayout.LayoutParams(
      ViewGroup.LayoutParams.WRAP_CONTENT,
      ViewGroup.LayoutParams.WRAP_CONTENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
      topMargin = 64
    }
    root.addView(title, titleParams)

    statusText = TextView(this).apply {
      text = "Keep your face inside the frame"
      setTextColor(Color.WHITE)
      textSize = 16f
      gravity = Gravity.CENTER
      setPadding(32, 12, 32, 12)
      background = roundedBackground(0x66000000)
    }
    val statusParams = FrameLayout.LayoutParams(
      ViewGroup.LayoutParams.WRAP_CONTENT,
      ViewGroup.LayoutParams.WRAP_CONTENT,
    ).apply {
      gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
      bottomMargin = 170
    }
    root.addView(statusText, statusParams)

    progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
      max = 100
      progress = 0
    }
    val progressParams = FrameLayout.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      14,
    ).apply {
      gravity = Gravity.BOTTOM
      leftMargin = 40
      rightMargin = 40
      bottomMargin = 130
    }
    root.addView(progressBar, progressParams)

    val cancelButton = Button(this).apply {
      text = "Cancel"
      setTextColor(Color.WHITE)
      background = roundedBackground(0x77000000)
      setOnClickListener {
        stopRequested = true
        setResult(RESULT_CANCELED)
        finish()
      }
    }
    val cancelParams = FrameLayout.LayoutParams(180, 86).apply {
      gravity = Gravity.TOP or Gravity.START
      topMargin = 54
      leftMargin = 28
    }
    root.addView(cancelButton, cancelParams)

    val guide = FaceGuideView(this)
    val guideParams = FrameLayout.LayoutParams(620, 760).apply {
      gravity = Gravity.CENTER
    }
    root.addView(guide, guideParams)

    setContentView(root)
  }

  private fun roundedBackground(color: Int): GradientDrawable =
    GradientDrawable().apply {
      setColor(color)
      cornerRadius = 28f
    }

  @SuppressLint("MissingPermission")
  private fun openCamera(width: Int, height: Int) {
    if (cameraDevice != null || isRecording) return

    val manager = getSystemService(Context.CAMERA_SERVICE) as CameraManager
    try {
      cameraId = chooseCamera(manager)
      val characteristics = manager.getCameraCharacteristics(cameraId)
      sensorOrientation = characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 90
      lensFacingFront =
        characteristics.get(CameraCharacteristics.LENS_FACING) ==
          CameraCharacteristics.LENS_FACING_FRONT

      val map = characteristics.get(
        CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP,
      ) ?: throw IllegalStateException("Camera stream map unavailable")

      val recorderSizes = map.getOutputSizes(MediaRecorder::class.java)
      previewSize = chooseVideoSize(recorderSizes)
      configureTransform(width, height)
      manager.openCamera(cameraId, stateCallback, backgroundHandler)
    } catch (error: Exception) {
      finishWithError(error.message ?: "Unable to open camera")
    }
  }

  private fun chooseCamera(manager: CameraManager): String {
    var fallback: String? = null

    for (id in manager.cameraIdList) {
      val characteristics = manager.getCameraCharacteristics(id)
      val facing = characteristics.get(CameraCharacteristics.LENS_FACING)
      if (fallback == null) fallback = id
      if (facing == CameraCharacteristics.LENS_FACING_FRONT) return id
    }

    return fallback ?: throw IllegalStateException("No camera found")
  }

  private fun chooseVideoSize(sizes: Array<Size>): Size {
    val preferred = sizes
      .filter { it.width <= 1280 && it.height <= 720 }
      .maxByOrNull { it.width * it.height }
    return preferred ?: sizes.maxByOrNull { it.width * it.height }
      ?: Size(640, 480)
  }

  private fun configureTransform(viewWidth: Int, viewHeight: Int) {
    if (!::previewSize.isInitialized || viewWidth == 0 || viewHeight == 0) return

    val rotation = windowManager.defaultDisplay.rotation
    val matrix = Matrix()
    val viewRect = RectF(0f, 0f, viewWidth.toFloat(), viewHeight.toFloat())
    val bufferRect = RectF(0f, 0f, previewSize.height.toFloat(), previewSize.width.toFloat())
    val centerX = viewRect.centerX()
    val centerY = viewRect.centerY()

    if (rotation == Surface.ROTATION_90 || rotation == Surface.ROTATION_270) {
      bufferRect.offset(centerX - bufferRect.centerX(), centerY - bufferRect.centerY())
      matrix.setRectToRect(viewRect, bufferRect, Matrix.ScaleToFit.FILL)
      val scale = max(
        viewHeight.toFloat() / previewSize.height,
        viewWidth.toFloat() / previewSize.width,
      )
      matrix.postScale(scale, scale, centerX, centerY)
      matrix.postRotate((90 * (rotation - 2)).toFloat(), centerX, centerY)
    } else if (rotation == Surface.ROTATION_180) {
      matrix.postRotate(180f, centerX, centerY)
    }

    textureView.setTransform(matrix)
  }

  private fun startRecordingSession() {
    val camera = cameraDevice ?: return
    val texture = textureView.surfaceTexture ?: return

    try {
      setupMediaRecorder()
      texture.setDefaultBufferSize(previewSize.width, previewSize.height)

      val previewSurface = Surface(texture)
      val recorderSurface = mediaRecorder!!.surface
      val requestBuilder = camera.createCaptureRequest(CameraDevice.TEMPLATE_RECORD).apply {
        addTarget(previewSurface)
        addTarget(recorderSurface)
        set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO)
      }

      camera.createCaptureSession(
        listOf(previewSurface, recorderSurface),
        object : CameraCaptureSession.StateCallback() {
          override fun onConfigured(session: CameraCaptureSession) {
            if (cameraDevice == null) return
            captureSession = session
            session.setRepeatingRequest(requestBuilder.build(), null, backgroundHandler)
            runOnUiThread { startRecorderTimer() }
          }

          override fun onConfigureFailed(session: CameraCaptureSession) {
            finishWithError("Unable to configure camera recording")
          }
        },
        backgroundHandler,
      )
    } catch (error: Exception) {
      finishWithError(error.message ?: "Unable to start video recording")
    }
  }

  private fun setupMediaRecorder() {
    val recorder = MediaRecorder()
    recorder.setVideoSource(MediaRecorder.VideoSource.SURFACE)
    recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
    recorder.setOutputFile(outputFile.absolutePath)
    recorder.setVideoEncodingBitRate(3_000_000)
    recorder.setVideoFrameRate(24)
    recorder.setVideoSize(previewSize.width, previewSize.height)
    recorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264)
    recorder.setOrientationHint(getOrientationHint())
    recorder.prepare()
    mediaRecorder = recorder
  }

  private fun getOrientationHint(): Int {
    val deviceRotation = when (windowManager.defaultDisplay.rotation) {
      Surface.ROTATION_90 -> 90
      Surface.ROTATION_180 -> 180
      Surface.ROTATION_270 -> 270
      else -> 0
    }

    return if (lensFacingFront) {
      (sensorOrientation + deviceRotation) % 360
    } else {
      (sensorOrientation - deviceRotation + 360) % 360
    }
  }

  private fun startRecorderTimer() {
    if (isRecording) return

    try {
      mediaRecorder?.start()
      isRecording = true
      statusText.text = "Recording... blink or turn your head slightly"

      val startedAt = System.currentTimeMillis()
      val tick = object : Runnable {
        override fun run() {
          if (!isRecording) return
          val elapsed = System.currentTimeMillis() - startedAt
          progressBar.progress = ((elapsed * 100) / durationMs).toInt().coerceIn(0, 100)

          while (
            nextSampleIndex < frameCount &&
            elapsed >= durationMs * (nextSampleIndex + 1L) / (frameCount + 1L)
          ) {
            capturePreviewFrame(nextSampleIndex)
            nextSampleIndex++
          }

          if (elapsed >= durationMs) {
            stopRecording(cancelled = false)
          } else {
            mainHandler.postDelayed(this, 80)
          }
        }
      }
      mainHandler.post(tick)
    } catch (error: Exception) {
      finishWithError(error.message ?: "Recording failed")
    }
  }

  private fun stopRecording(cancelled: Boolean) {
    if (stopRequested) return
    stopRequested = true
    mainHandler.removeCallbacksAndMessages(null)

    try {
      captureSession?.stopRepeating()
      captureSession?.abortCaptures()
    } catch (_: Exception) {
    }

    if (isRecording) {
      try {
        mediaRecorder?.stop()
      } catch (error: RuntimeException) {
        outputFile.delete()
        if (!cancelled) {
          finishWithError("Recorded video was too short")
          return
        }
      } finally {
        isRecording = false
        mediaRecorder?.reset()
        mediaRecorder?.release()
        mediaRecorder = null
      }
    }

    if (cancelled) {
      closeCamera()
      setResult(RESULT_CANCELED)
    } else {
      while (sampledFrameUris.size < frameCount && textureView.isAvailable) {
        val before = sampledFrameUris.size
        capturePreviewFrame(sampledFrameUris.size)
        if (sampledFrameUris.size == before) break
      }

      closeCamera()
      statusText.text = "Video captured"
      val result = Intent().apply {
        putExtra(EXTRA_VIDEO_URI, android.net.Uri.fromFile(outputFile).toString())
        putExtra(EXTRA_DURATION_MS, durationMs)
        putStringArrayListExtra(EXTRA_FRAME_URIS, sampledFrameUris)
      }
      setResult(RESULT_OK, result)
    }
    finish()
  }

  private fun capturePreviewFrame(index: Int) {
    try {
      val rawBitmap = textureView.bitmap ?: return
      val bitmap = normalizePreviewBitmap(rawBitmap)
      val frameFile = File(
        framesDir,
        "datalake_preview_frame_${index}_${System.currentTimeMillis()}.jpg",
      )

      FileOutputStream(frameFile).use { output ->
        bitmap.compress(Bitmap.CompressFormat.JPEG, 92, output)
      }

      val uri = android.net.Uri.fromFile(frameFile).toString()
      sampledFrameUris.add(uri)
      Log.i(TAG, "Saved preview frame $index ${bitmap.width}x${bitmap.height} to $uri")
    } catch (error: Exception) {
      Log.w(TAG, "Unable to save preview frame $index", error)
    }
  }

  private fun normalizePreviewBitmap(bitmap: Bitmap): Bitmap {
    if (bitmap.height >= bitmap.width) return bitmap

    val matrix = Matrix()
    matrix.postRotate(90f)
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
  }

  private fun closeCamera() {
    try {
      captureSession?.close()
      captureSession = null
      cameraDevice?.close()
      cameraDevice = null
      mediaRecorder?.release()
      mediaRecorder = null
    } catch (_: Exception) {
    }
  }

  private fun startBackgroundThread() {
    backgroundThread = HandlerThread("DataLakeVideoCamera").also { thread ->
      thread.start()
      backgroundHandler = Handler(thread.looper)
    }
  }

  private fun stopBackgroundThread() {
    backgroundThread?.quitSafely()
    try {
      backgroundThread?.join()
    } catch (_: InterruptedException) {
    }
    backgroundThread = null
    backgroundHandler = null
  }

  private fun finishWithError(message: String) {
    val result = Intent().apply { putExtra(EXTRA_ERROR, message) }
    setResult(RESULT_CANCELED, result)
    finish()
  }

  class FaceGuideView(context: Context) : android.view.View(context) {
    private val paint = android.graphics.Paint().apply {
      color = Color.WHITE
      strokeWidth = 7f
      style = android.graphics.Paint.Style.STROKE
      alpha = 190
    }

    override fun onDraw(canvas: android.graphics.Canvas) {
      super.onDraw(canvas)
      val len = 90f
      val pad = 20f
      canvas.drawLine(pad, pad, pad + len, pad, paint)
      canvas.drawLine(pad, pad, pad, pad + len, paint)
      canvas.drawLine(width - pad, pad, width - pad - len, pad, paint)
      canvas.drawLine(width - pad, pad, width - pad, pad + len, paint)
      canvas.drawLine(pad, height - pad, pad + len, height - pad, paint)
      canvas.drawLine(pad, height - pad, pad, height - pad - len, paint)
      canvas.drawLine(width - pad, height - pad, width - pad - len, height - pad, paint)
      canvas.drawLine(width - pad, height - pad, width - pad, height - pad - len, paint)
    }
  }

  companion object {
    private const val TAG = "DataLakeVideo"
    const val EXTRA_OUTPUT_PATH = "outputPath"
    const val EXTRA_FRAMES_DIR = "framesDir"
    const val EXTRA_DURATION_MS = "durationMs"
    const val EXTRA_FRAME_COUNT = "frameCount"
    const val EXTRA_VIDEO_URI = "videoUri"
    const val EXTRA_FRAME_URIS = "frameUris"
    const val EXTRA_ERROR = "error"
    private const val DEFAULT_DURATION_MS = 3200L
    private const val DEFAULT_FRAME_COUNT = 6
  }
}
