package org.iota.mobile;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableNativeArray;

public class EntangledAndroid extends ReactContextBaseJavaModule {
    public EntangledAndroid(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "EntangledAndroid";
    }

    @ReactMethod
    public void generateAddress(String seed, int index, int security, Promise promise) {
      String address = Interface.generateAddress(seed, index, security);
      promise.resolve(address);
    }

    @ReactMethod
    public void generateAddresses(String seed, int index, int security, int total, Promise promise) {
        WritableNativeArray addresses = new WritableNativeArray();
        int i = 0;

        do {
            String address = Interface.generateAddress(seed, index, security);
            addresses.pushString(address);
            i++;
            index++;
        } while (i < total);

        promise.resolve(addresses);
    }


    @ReactMethod
    public void generateSignature(String trytes, int index, int security, String bundleHash, Promise promise) {
      String signature = Interface.generateSignature(trytes, index, security, bundleHash);
      promise.resolve(signature);
    }

    @ReactMethod
    public void doPoW(String trytes, int mwm, Promise promise) {
        String nonce = Interface.doPOW(trytes, mwm);
        promise.resolve(nonce);
    }
}