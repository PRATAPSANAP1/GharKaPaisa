// Axis
import axisAce from './image/AXIS/ace.png';
import axisAtlas from './image/AXIS/atlas.png';
import axisAura from './image/AXIS/aura.png';
import axisFlipkart from './image/AXIS/flipkart.png';
import axisIndianoil from './image/AXIS/indianoil.png';
import axisMyzone from './image/AXIS/my zone.png';
import axisNeo from './image/AXIS/neo.png';
import axisPrivilege from './image/AXIS/privilege.png';
import axisRewards from './image/AXIS/rewards.png';
import axisSelect from './image/AXIS/select.png';
import axisVistaraInfinite from './image/AXIS/vistara infinite.png';
import axisVistara from './image/AXIS/vistara.png';

// BOB
import bobEasy from './image/BOB/easy.png';
import bobEterna from './image/BOB/eterna.png';
import bobHpcl from './image/BOB/hpcl.png';
import bobPremier from './image/BOB/premier.png';
import bob6 from './image/BOB/BOB6.png';
import bobSelect from './image/BOB/select.png';

// HDFC
import hdfcAgainstExistingFd from './image/HDFC/against.png';
import hdfcBizfirst from './image/HDFC/bizfirst.png';
import hdfcBizgrow from './image/HDFC/bizgrow.png';
import hdfcBizpower from './image/HDFC/bizpower.png';
import hdfcDinersClubBlack from './image/HDFC/diners club black.png';
import hdfcDinersClub from './image/HDFC/diners club.png';
import hdfcFreedom from './image/HDFC/freedom.png';
import hdfcIndianoil from './image/HDFC/indianoil.png';
import hdfcIrcte from './image/HDFC/ircte.png';
import hdfcMarriottBonvoy from './image/HDFC/marriott bonvoy.png';
import hdfcMillennia from './image/HDFC/millennia.png';
import hdfcMoneyback from './image/HDFC/moneyback+.png';
import hdfcNewFdBased from './image/HDFC/new fd based.png';
import hdfcPixelGo from './image/HDFC/pixel go.png';
import hdfcPixelPlay from './image/HDFC/pixel play.png';
import hdfcRegaliaGold from './image/HDFC/reqalia gold.png';
import hdfcShopperStop from './image/HDFC/shopper stop.png';
import hdfcShoppersStopBlack from './image/HDFC/shoppers stop black.png';
import hdfcSwiggyHdfc from './image/HDFC/swiggy hdfc.png';
import hdfcTataNeuInfinite from './image/HDFC/tata neu infinite.png';
import hdfcTataNeuplus from './image/HDFC/tata neuplus.png';

// ICICI
import iciciAmazon from './image/icici/amazon.png';
import iciciCoral from './image/icici/coral.png';
import iciciEmirates from './image/icici/emirates.png';
import iciciExpressions from './image/icici/expressions.png';
import iciciHpclSuperSaver from './image/icici/hpcl super saver.png';
import iciciMakemytrip from './image/icici/makemytrip.png';
import iciciManchesterUnited from './image/icici/manchester united.png';
import iciciPlatinumChip from './image/icici/platinum chip.png';
import iciciRuby from './image/icici/ruby.png';
import iciciSapphero from './image/icici/sapphero.png';

// IDFC
import idfcClassic from './image/IDFC/classic visa.png';
import idfcMilennia from './image/IDFC/millenia.png';
import idfcSelect from './image/IDFC/select.png';
import idfcLogo from '../banks/idfc_first_bank.png';

const idfcAshva = idfcSelect;
const idfcFamily = idfcSelect;
const idfcPower = idfcSelect;
const idfcPrkote = idfcSelect;
const idfcWealth = idfcSelect;

// IND
import ind1 from './image/IND/legend.png';
import ind2 from './image/IND/platinum aura edge.png';
import ind3 from './image/IND/avios.png';
import ind4 from './image/IND/eazydiner.png';
import ind5 from './image/IND/pinnacle.png';
import ind6 from './image/IND/samman.png';
import ind7 from './image/IND/nexxt.png';
import ind8 from './image/IND/fd credit.png';

// SBI
import sbiAirIndiaPlatinum from './image/SBI/air india platinum.png';
import sbiAirIndiaSignature from './image/SBI/air india signature.png';
import sbiApollo from './image/SBI/apollo.png';
import sbiBpclOctane from './image/SBI/BPCL octate.png';
import sbiBpcl from './image/SBI/bpcl.png';
import sbiClubVistaraCard from './image/SBI/club vistara card.png';
import sbiClubVistaraPrime from './image/SBI/club vistare prime.png';
import sbiIrctc from './image/SBI/irctc.png';
import sbiPulse from './image/SBI/pulse.png';
import sbiSimplyClick from './image/SBI/simply click.png';
import sbiSimplySave from './image/SBI/simply save.png';
import sbiTataNeu from './image/SBI/tata neu.png';

// Fallbacks/General bank images
import axisGeneral from './image/AXIS/AXIS.png';
import sbiGeneral from './image/SBI/SBI.png';
import iciciGeneral from './image/icici/ICICI.png';
import kotakGeneral from './image/kotak/KOTAK.png';
import yesGeneral from './image/yes/yes bank.png';
import hdfcGeneral from './image/HDFC/hdfc.png';

export const getCardSpecificImage = (cardName) => {
  if (!cardName) return null;
  const name = cardName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // HDFC
  if (name.includes('freedom')) return hdfcFreedom;
  if (name.includes('moneyback')) return hdfcMoneyback;
  if (name.includes('millennia')) return hdfcMillennia;
  if (name.includes('regalia')) return hdfcRegaliaGold;
  if (name.includes('bizgrow')) return hdfcBizgrow;
  if (name.includes('bizpower')) return hdfcBizpower;
  if (name.includes('bizfirst')) return hdfcBizfirst;
  if (name.includes('pixelplay')) return hdfcPixelPlay;
  if (name.includes('pixelgo')) return hdfcPixelGo;
  if (name.includes('tataneuplus')) return hdfcTataNeuplus;
  if (name.includes('tataneuinfinity')) return hdfcTataNeuInfinite;
  if (name.includes('swiggy')) return hdfcSwiggyHdfc;
  if (name.includes('indianoil') && name.includes('hdfc')) return hdfcIndianoil;
  if (name.includes('irctc') && name.includes('hdfc')) return hdfcIrcte;
  if (name.includes('dinersclubprivilege') || name.includes('dinersprivilege')) return hdfcDinersClub;
  if (name.includes('dinersclubblack') || name.includes('dinersblack')) return hdfcDinersClubBlack;
  if (name.includes('marriott')) return hdfcMarriottBonvoy;
  if (name.includes('shoppersstopblack')) return hdfcShoppersStopBlack;
  if (name.includes('shoppersstop') || name.includes('shopperstop')) return hdfcShopperStop;
  if (name.includes('existingfd')) return hdfcAgainstExistingFd;
  if (name.includes('newfd')) return hdfcNewFdBased;

  // AXIS
  if (name.includes('axis')) {
    if (name.includes('ace')) return axisAce;
    if (name.includes('atlas')) return axisAtlas;
    if (name.includes('aura')) return axisAura;
    if (name.includes('flipkart')) return axisFlipkart;
    if (name.includes('indianoil')) return axisIndianoil;
    if (name.includes('myzone')) return axisMyzone;
    if (name.includes('neo')) return axisNeo;
    if (name.includes('privilege')) return axisPrivilege;
    if (name.includes('rewards')) return axisRewards;
    if (name.includes('select')) return axisSelect;
    if (name.includes('vistarasignature') || name.includes('vistara') && !name.includes('infinite')) return axisVistara;
    if (name.includes('vistarainfinite')) return axisVistaraInfinite;
  }

  // BOB
  if (name.includes('bob') || name.includes('baroda')) {
    if (name.includes('easy')) return bobEasy;
    if (name.includes('eterna')) return bobEterna;
    if (name.includes('hpcl')) return bobHpcl;
    if (name.includes('premier')) return bobPremier;
    if (name.includes('prime')) return bob6;
    if (name.includes('select')) return bobSelect;
    if (name.includes('snapdeal')) return bob6;
  }

  // ICICI
  if (name.includes('icici')) {
    if (name.includes('amazon')) return iciciAmazon;
    if (name.includes('coral') && name.includes('rupay')) return iciciCoral;
    if (name.includes('coral')) return iciciCoral;
    if (name.includes('emirates')) return iciciEmirates;
    if (name.includes('expressions')) return iciciExpressions;
    if (name.includes('hpcl')) return iciciHpclSuperSaver;
    if (name.includes('makemytrip') || name.includes('mmt')) return iciciMakemytrip;
    if (name.includes('manchester')) return iciciManchesterUnited;
    if (name.includes('platinum')) return iciciPlatinumChip;
    if (name.includes('rubyx') || name.includes('ruby')) return iciciRuby;
    if (name.includes('sapphero')) return iciciSapphero;
  }

  // IDFC
  if (name.includes('idfc')) {
    if (name.includes('ashva')) return idfcAshva;
    if (name.includes('classic')) return idfcClassic;
    if (name.includes('family')) return idfcFamily;
    if (name.includes('milennia') || name.includes('millennia')) return idfcMilennia;
    if (name.includes('power')) return idfcPower;
    if (name.includes('wow')) return idfcPrkote;
    if (name.includes('select')) return idfcSelect;
    if (name.includes('wealth')) return idfcWealth;
  }

  // INDUSIND
  if (name.includes('indusind') || name.includes('indus')) {
    if (name.includes('legend')) return ind1;
    if (name.includes('platinum') && name.includes('rupay')) return ind2;
    return ind1;
  }

  // SBI
  if (name.includes('sbi') || name.includes('simply')) {
    if (name.includes('airindia') && name.includes('platinum')) return sbiAirIndiaPlatinum;
    if (name.includes('airindia') && name.includes('signature')) return sbiAirIndiaSignature;
    if (name.includes('apollo')) return sbiApollo;
    if (name.includes('octane') || name.includes('octate')) return sbiBpclOctane;
    if (name.includes('bpcl')) return sbiBpcl;
    if (name.includes('vistara') && name.includes('prime')) return sbiClubVistaraPrime;
    if (name.includes('vistara') || name.includes('vistare')) return sbiClubVistaraCard;
    if (name.includes('irctc')) return sbiIrctc;
    if (name.includes('pulse')) return sbiPulse;
    if (name.includes('click')) return sbiSimplyClick;
    if (name.includes('save')) return sbiSimplySave;
    if (name.includes('tataneu') || name.includes('neu')) return sbiTataNeu;
  }

  // Generic fallback by bank name
  if (name.includes('axis')) return axisGeneral;
  if (name.includes('sbi')) return sbiGeneral;
  if (name.includes('icici')) return iciciGeneral;
  if (name.includes('kotak')) return kotakGeneral;
  if (name.includes('yes')) return yesGeneral;
  if (name.includes('hdfc')) return hdfcGeneral;

  return null;
};
