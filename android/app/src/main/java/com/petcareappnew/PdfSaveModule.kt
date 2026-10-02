
package com.petcareappnew

import android.app.Activity
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.BaseActivityEventListener
import java.io.File
import java.io.IOException

class PdfSaveModule(
    private val context: ReactApplicationContext
) : ReactContextBaseJavaModule(context) {

    private var savePromise: Promise? = null

    companion object {
        private const val REQUEST_CREATE_DOCUMENT = 7241
    }

    override fun getName(): String = "PdfSaveModule"

    private val activityListener: ActivityEventListener =
        object : BaseActivityEventListener() {
            override fun onActivityResult(
                activity: Activity,
                requestCode: Int,
                resultCode: Int,
                data: Intent?
            ) {
                if (requestCode != REQUEST_CREATE_DOCUMENT) return

                val promise = savePromise
                savePromise = null

                if (resultCode != Activity.RESULT_OK || data?.data == null) {
                    promise?.resolve(false)
                    return
                }

                val destination: Uri = data.data!!
                val sourcePath = pendingSourcePath

                if (sourcePath.isNullOrBlank()) {
                    promise?.reject("SOURCE_MISSING", "PDF dosyasının yolu bulunamadı.")
                    return
                }

                try {
                    val sourceFile = File(sourcePath.removePrefix("file://"))

                    if (!sourceFile.exists()) {
                        promise?.reject("FILE_NOT_FOUND", "Oluşturulan PDF dosyası bulunamadı.")
                        return
                    }

                    context.contentResolver.openOutputStream(destination)?.use { output ->
                        sourceFile.inputStream().use { input ->
                            input.copyTo(output)
                        }
                    } ?: throw IOException("Seçilen konuma yazılamadı.")

                    promise?.resolve(true)
                } catch (error: Exception) {
                    promise?.reject("SAVE_FAILED", error.message, error)
                } finally {
                    pendingSourcePath = null
                }
            }
        }

    private var pendingSourcePath: String? = null

    init {
        context.addActivityEventListener(activityListener)
    }

    @ReactMethod
    fun savePdf(sourcePath: String, suggestedName: String, promise: Promise) {
        val activity = getCurrentActivity()

        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Android etkinliği bulunamadı.")
            return
        }

        if (savePromise != null) {
            promise.reject("SAVE_IN_PROGRESS", "Başka bir kaydetme işlemi devam ediyor.")
            return
        }

        val sourceFile = File(sourcePath.removePrefix("file://"))

        if (!sourceFile.exists()) {
            promise.reject("FILE_NOT_FOUND", "PDF dosyası bulunamadı: $sourcePath")
            return
        }

        savePromise = promise
        pendingSourcePath = sourceFile.absolutePath

        val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "application/pdf"
            putExtra(Intent.EXTRA_TITLE, suggestedName)
        }

        try {
            activity.startActivityForResult(intent, REQUEST_CREATE_DOCUMENT)
        } catch (error: Exception) {
            savePromise = null
            pendingSourcePath = null
            promise.reject("SAVE_DIALOG_FAILED", error.message, error)
        }
    }


    override fun invalidate() {
        context.removeActivityEventListener(activityListener)
        savePromise?.reject("MODULE_INVALIDATED", "Kaydetme işlemi iptal edildi.")
        savePromise = null
        pendingSourcePath = null
        super.invalidate()
    }
}