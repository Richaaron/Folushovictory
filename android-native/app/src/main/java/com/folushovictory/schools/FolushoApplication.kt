package com.folushovictory.schools

import android.app.Application
import com.folushovictory.schools.api.RetrofitClient

class FolushoApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        RetrofitClient.init(this)
    }
}
