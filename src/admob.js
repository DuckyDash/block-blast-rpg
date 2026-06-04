import { Capacitor } from '@capacitor/core'
import { AdMob } from '@capacitor-community/admob'

export const admobConfig = {
  appId: "ca-app-pub-1365480066722808~2950320324",
  bannerAdId: "ca-app-pub-1365480066722808/7053216866",
  interstitialAdId: "ca-app-pub-3940256099942544/1033173712",
  rewardedAdId: "ca-app-pub-3940256099942544/5224354917",
};

export function isNativeAdMob() {
  return Capacitor.isNativePlatform()
}

export async function initAdMob() {
  if (!isNativeAdMob()) {
    return
  }

  return AdMob.initialize()
}

export async function showBannerAd(adId = admobConfig.bannerAdId) {
  if (!isNativeAdMob()) {
    return
  }

  return AdMob.showBanner({
    adId,
    adSize: 'SMART_BANNER',
    position: 'BOTTOM_CENTER',
    margin: 0,
  })
}

export async function hideBannerAd() {
  if (!isNativeAdMob()) {
    return
  }

  return AdMob.hideBanner()
}

export async function showInterstitialAd(adId = admobConfig.interstitialAdId) {
  if (!isNativeAdMob()) {
    return
  }

  await AdMob.prepareInterstitial({ adId })
  return AdMob.showInterstitial()
}

export async function showRewardedAd(adId = admobConfig.rewardedAdId) {
  if (!isNativeAdMob()) {
    return
  }

  await AdMob.prepareRewardVideoAd({ adId })
  return AdMob.showRewardVideoAd()
}
