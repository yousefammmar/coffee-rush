import { describe, it, expect, vi } from 'vitest';
import { defaultSave, serialize, deserialize, migrate, sanitize, loadSave, writeSave, SAVE_KEY, SAVE_VERSION } from '../src/systems/SaveSystem.js';
import { memStore } from './helpers.js';

describe('save system', () => {
  it('round-trips a save', () => {
    const d = defaultSave(); d.started = true; d.day = 6; d.money = 321; d.upgrades.espresso = 2; d.decor.owned.push('theme:forest'); d.decor.equipped.theme = 'forest'; d.mastery.latte = 7; d.achievements.first_cup = 123;
    const back = deserialize(serialize(d));
    expect(back).toEqual(sanitize(d)); expect(back.day).toBe(6); expect(back.decor.equipped.theme).toBe('forest'); expect(back.mastery.latte).toBe(7);
  });
  it('migrates v1 saves', () => {
    const v1 = { version: 1, day: 4, money: 250, unlocked: ['espresso', 'latte', 'americano'], achievements: ['first_cup'], upgrades: { espresso: 1 }, stats: { served: 12 } };
    const s = migrate(v1);
    expect(s.version).toBe(SAVE_VERSION); expect(s.day).toBe(4); expect(s.started).toBe(true);
    expect(s.unlockedRecipes).toEqual(expect.arrayContaining(['espresso', 'latte', 'americano', 'caramel_latte', 'iced_latte']));
    expect(s.achievements.first_cup).toBe(0); expect(s.stats.served).toBe(12); expect(s.decor.owned).toEqual([]);
  });
  it('sanitizes garbage values', () => {
    const s = sanitize({ day: -5, money: 'lots', upgrades: { espresso: 99, fake: 3 }, unlockedRecipes: ['latte', 'unicorn'], decor: { owned: ['theme:forest', 'x:y'], equipped: { theme: 'sunset', wall: 'sage' } }, settings: { master: 7, speed: 3 } });
    expect(s.day).toBe(1); expect(s.money).toBe(100); expect(s.upgrades.espresso).toBe(3); expect(s.upgrades.fake).toBeUndefined();
    expect(s.unlockedRecipes).not.toContain('unicorn'); expect(s.decor.owned).toEqual(['theme:forest']);
    expect(s.decor.equipped.theme).toBe('classic'); // sunset not owned
    expect(s.settings.master).toBe(1); expect(s.settings.speed).toBe(1);
  });
  it('handles corrupted storage without throwing and keeps good saves', () => {
    const st = memStore(); st.setItem(SAVE_KEY, '{not json');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(loadSave(st).day).toBe(1); expect(warn).toHaveBeenCalled(); warn.mockRestore();
    const d = defaultSave(); d.started = true; d.day = 3; writeSave(d, st);
    expect(loadSave(st).day).toBe(3); expect(loadSave(st).started).toBe(true);
    expect(loadSave(memStore()).started).toBe(false);
  });
});
