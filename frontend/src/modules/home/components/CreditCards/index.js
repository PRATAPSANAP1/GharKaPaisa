import { HDFCCards } from './HDFCCards';
import { SBICards } from './SBICards';
import { AxisCards } from './AxisCards';
import { BOBCards } from './BOBCards';
import { ICICICards } from './ICICICards';
import { KotakCards } from './KotakCards';
import { YesBankCards } from './YesBankCards';

export { ltfCards, cardRankings } from './LTFCardsData';

export const bankCardsDetails = {
  hdfc: HDFCCards,
  sbi: SBICards,
  axis: AxisCards,
  bob: BOBCards,
  icici: ICICICards,
  kotak: KotakCards,
  yes: YesBankCards
};
