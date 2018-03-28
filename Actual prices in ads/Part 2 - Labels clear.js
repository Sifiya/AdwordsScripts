var CHECKED_LABEL_NAME = "PriceChecked";//Ярлык уже проверенных объявлений

function main() {
  var adsIterator = AdWordsApp.ads().withCondition("LabelNames CONTAINS_ANY ['" + CHECKED_LABEL_NAME + "']").get();
  while (adsIterator.hasNext()) {
    var ad = adsIterator.next();
    ad.removeLabel(CHECKED_LABEL_NAME);
  }

}
