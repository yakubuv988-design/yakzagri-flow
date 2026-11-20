import { describe, it, expect } from 'vitest';
import { yo } from './yo';

describe('Yoruba translations (yo)', () => {
  it('translates escrow milestone states', () => {
    expect(yo.escrow.states.initiated).toBe('Ti bẹrẹ');
    expect(yo.escrow.states.funded).toBe('Ti san owo');
    expect(yo.escrow.states.dispatched).toBe('Ti firanṣẹ');
    expect(yo.escrow.states.delivered).toBe('Ti de');
  });

  it('translates negotiation prompts', () => {
    expect(yo.negotiation.title).toBeTruthy();
    expect(yo.negotiation.prompts.makeOffer).toBeTruthy();
    expect(yo.negotiation.prompts.counterOffer).toBeTruthy();
    expect(yo.negotiation.prompts.acceptOffer).toBeTruthy();
    expect(yo.negotiation.prompts.rejectOffer).toBeTruthy();
  });

  it('translates loss sharing slider labels', () => {
    expect(yo.lossSharing.title).toBeTruthy();
    expect(yo.lossSharing.lossRatio).toBeTruthy();
    expect(yo.lossSharing.sliderLabel).toBeTruthy();
    expect(yo.lossSharing.buyerShare).toBeTruthy();
    expect(yo.lossSharing.sellerShare).toBeTruthy();
  });

  it('translates driver manifest terms', () => {
    expect(yo.driverManifest.title).toBeTruthy();
    expect(yo.driverManifest.driver).toBeTruthy();
    expect(yo.driverManifest.vehicle).toBeTruthy();
    expect(yo.driverManifest.cargo).toBeTruthy();
    expect(yo.driverManifest.departure).toBeTruthy();
    expect(yo.driverManifest.arrival).toBeTruthy();
  });
});
