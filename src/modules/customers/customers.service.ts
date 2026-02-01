import createHttpError from 'http-errors';
import * as customerRepo from './customers.repo';
import { CreateCustomerInput, UpdateCustomerInput, CustomerFilters } from './customers.types';

export async function listCustomers(salonId: string, filters: CustomerFilters) {
  return customerRepo.findManyProfiles(salonId, filters);
}

export async function getCustomerDetail(salonId: string, customerId: string) {
  const customer = await customerRepo.findProfileById(salonId, customerId);
  if (!customer) {
    throw createHttpError(404, 'Customer not found');
  }
  return customer;
}

export async function createCustomer(salonId: string, input: CreateCustomerInput) {
  // 1. Upsert global customer account
  const account = await customerRepo.upsertCustomerAccount(input.phone, input.fullName);

  // 2. Check if profile already exists for this salon
  const existingProfile = await customerRepo.findProfileByAccountId(salonId, account.id);
  if (existingProfile) {
    throw createHttpError(409, 'Customer already exists in this salon');
  }

  // 3. Create salon-specific profile
  return customerRepo.createProfile({
    salonId,
    customerAccountId: account.id,
    displayName: input.displayName || input.fullName,
    note: input.note,
  });
}

export async function updateCustomer(
  salonId: string,
  customerId: string,
  input: UpdateCustomerInput
) {
  // Verify it exists first for better error message
  const existing = await customerRepo.findProfileById(salonId, customerId);
  if (!existing) {
    throw createHttpError(404, 'Customer not found');
  }

  return customerRepo.updateProfile(customerId, salonId, input);
}

export async function deleteCustomer(salonId: string, customerId: string) {
    const deleted = await customerRepo.deleteProfile(customerId, salonId);
    if (!deleted) {
        throw createHttpError(404, 'Customer not found');
    }
    return deleted;
}
