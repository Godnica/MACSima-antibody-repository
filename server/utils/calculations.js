/**
 * Single source of truth for all titration and cost calculations.
 * See §3 of CLAUDE.md for the formulas.
 */

exports.ulPerSlide = (totalCocktailVolume, titrationRatio) => {
  return totalCocktailVolume / titrationRatio;
};

exports.totalUlUsed = (ulPerSlide, macswellSlides) => {
  return ulPerSlide * macswellSlides;
};

exports.totalChf = (totalUlUsed, chfPerUl) => {
  return totalUlUsed * chfPerUl;
};

exports.chfPerUl = (costChf, volumeOnArrival) => {
  return costChf / volumeOnArrival;
};
