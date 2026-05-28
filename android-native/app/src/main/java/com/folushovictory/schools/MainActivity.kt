package com.folushovictory.schools

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.viewmodel.Portal
import com.google.android.material.bottomnavigation.BottomNavigationView

class MainActivity : AppCompatActivity() {
    companion object {
        const val EXTRA_PORTAL = "EXTRA_PORTAL"
    }

    private lateinit var bottomNav: BottomNavigationView
    private var portal: Portal = Portal.ADMIN

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        bottomNav = findViewById(R.id.bottomNav)
        portal = resolvePortal()
        setupBottomNavigation()

        if (savedInstanceState == null) {
            openInitialFragment()
        }
    }

    private fun resolvePortal(): Portal {
        val intentPortal = intent?.getStringExtra(EXTRA_PORTAL)?.uppercase()
        val savedPortal = RetrofitClient.getSavedPortal()?.takeIf { it.isNotBlank() }?.uppercase()
        val portalName = intentPortal ?: savedPortal ?: Portal.ADMIN.name
        return try {
            Portal.valueOf(portalName)
        } catch (e: Exception) {
            Portal.ADMIN
        }
    }

    private fun setupBottomNavigation() {
        bottomNav.menu.clear()
        when (portal) {
            Portal.TEACHER -> bottomNav.inflateMenu(R.menu.bottom_nav_teacher)
            Portal.PARENT -> bottomNav.inflateMenu(R.menu.bottom_nav_parent)
            else -> bottomNav.inflateMenu(R.menu.bottom_nav_menu)
        }

        bottomNav.setOnItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.nav_dashboard -> {
                    val fragment = when (portal) {
                        Portal.TEACHER -> TeacherDashboardFragment()
                        Portal.PARENT -> ParentDashboardFragment()
                        else -> DashboardFragment()
                    }
                    supportFragmentManager.beginTransaction()
                        .replace(R.id.fragmentContainer, fragment)
                        .commit()
                    true
                }
                R.id.nav_students -> {
                    supportFragmentManager.beginTransaction()
                        .replace(R.id.fragmentContainer, StudentsFragment())
                        .commit()
                    true
                }
                R.id.nav_results -> {
                    val fragment = when (portal) {
                        Portal.TEACHER -> ResultsFragment()
                        Portal.PARENT -> ParentReportsFragment()
                        else -> AdminResultsFragment()
                    }
                    supportFragmentManager.beginTransaction()
                        .replace(R.id.fragmentContainer, fragment)
                        .commit()
                    true
                }
                R.id.nav_score_entry -> {
                    supportFragmentManager.beginTransaction()
                        .replace(R.id.fragmentContainer, ScoreEntryEnhancedFragment())
                        .commit()
                    true
                }
                R.id.nav_broadsheet -> {
                    supportFragmentManager.beginTransaction()
                        .replace(R.id.fragmentContainer, BroadsheetEnhancedFragment())
                        .commit()
                    true
                }
                R.id.nav_classes -> {
                    val fragment = if (portal == Portal.TEACHER) {
                        FormClassManagementFragment()
                    } else {
                        ClassesFragment()
                    }
                    supportFragmentManager.beginTransaction()
                        .replace(R.id.fragmentContainer, fragment)
                        .commit()
                    true
                }
                R.id.nav_settings -> {
                    supportFragmentManager.beginTransaction()
                        .replace(R.id.fragmentContainer, SettingsFragment())
                        .commit()
                    true
                }
                else -> false
            }
        }
    }

    private fun openInitialFragment() {
        val initialFragment = when (portal) {
            Portal.TEACHER -> TeacherDashboardFragment()
            Portal.PARENT -> ParentDashboardFragment()
            else -> DashboardFragment()
        }
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, initialFragment)
            .commit()
    }
}
