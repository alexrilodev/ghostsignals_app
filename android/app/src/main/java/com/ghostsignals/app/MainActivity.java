package com.ghostsignals.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.ghostsignals.app.plugins.SettingsPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(SettingsPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
