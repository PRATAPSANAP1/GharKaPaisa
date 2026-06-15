import { HDFCCards } from './HDFCCards';
import { SBICards } from './SBICards';
import { AxisCards } from './AxisCards';
import { BOBCards } from './BOBCards';

export { ltfCards, cardRankings } from './LTFCardsData';

export const bankCardsDetails = {
  hdfc: HDFCCards,
  sbi: SBICards,
  axis: AxisCards,
  bob: BOBCards
};
