import { describe, expect, it } from 'vitest';
import {
  CommunityError,
  assertPublicationLimit,
  getVoteTransition,
  validatePublicationInput,
  validateNick,
} from '@/lib/community';

describe('community validation', () => {
  it('rejects descriptions longer than 60 characters', () => {
    expect(() => validatePublicationInput({ description: 'a'.repeat(61), tags: ['damage'] })).toThrow(
      CommunityError,
    );
  });

  it('rejects more than three tags', () => {
    expect(() => validatePublicationInput({
      description: 'Time forte',
      tags: ['damage', 'defense', 'mount', 'loot'],
    })).toThrow(CommunityError);
  });

  it('rejects tags outside the predefined categories', () => {
    expect(() => validatePublicationInput({
      description: 'Time forte',
      tags: ['not-a-category'],
    })).toThrow(CommunityError);
  });

  it('enforces the five-publication limit', () => {
    expect(() => assertPublicationLimit(5)).toThrow(CommunityError);
    expect(() => assertPublicationLimit(4)).not.toThrow();
  });

  it('transitions a like into a dislike with the correct deltas', () => {
    expect(getVoteTransition(1, -1)).toEqual({
      next: -1,
      likesDelta: -1,
      dislikesDelta: 1,
    });
  });

  it('removes a vote when the same button is clicked again', () => {
    expect(getVoteTransition(-1, -1)).toEqual({
      next: null,
      likesDelta: 0,
      dislikesDelta: -1,
    });
  });

  it('normalizes nicknames and enforces their length', () => {
    expect(validateNick('  Luna  ')).toBe('Luna');
    expect(() => validateNick('no')).toThrow(CommunityError);
  });
});
