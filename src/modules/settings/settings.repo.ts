
import { prisma } from '../../config/prisma';
import { Settings } from '@prisma/client';

/**
 * Finds the settings for a given salon.
 * @param {string} salonId - The ID of the salon.
 * @returns {Promise<Settings | null>} The settings object or null if not found.
 */
export const findSetting = async (salonId: string): Promise<Settings | null> => {
  return prisma.settings.findUnique({
    where: {
      salonId,
    },
  });
};
