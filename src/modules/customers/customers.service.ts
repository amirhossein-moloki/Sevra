import AppError from '../../common/errors/AppError';
import httpStatus from 'http-status';
import * as customerRepo from './customers.repo';
import { CreateCustomerInput, UpdateCustomerInput, CustomerFilters } from './customers.types';

export async function listCustomers(salonId: string, filters: CustomerFilters) {
  return customerRepo.findManyProfiles(salonId, filters);
}

export async function getCustomerDetail(salonId: string, customerId: string) {
  const customer = await customerRepo.findProfileById(salonId, customerId);
  if (!customer) {
    throw new AppError('Customer not found', httpStatus.NOT_FOUND);
  }
  return customer;
}

export async function createCustomer(salonId: string, input: CreateCustomerInput) {
  // 1. Upsert global customer account
  const account = await customerRepo.upsertCustomerAccount(input.phone, input.fullName);

  // 2. Check if profile already exists for this salon
  const existingProfile = await customerRepo.findProfileByAccountId(salonId, account.id);
  if (existingProfile) {
    throw new AppError('Customer already exists in this salon', httpStatus.CONFLICT);
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
    throw new AppError('Customer not found', httpStatus.NOT_FOUND);
  }

  return customerRepo.updateProfile(customerId, salonId, input);
}

export async function deleteCustomer(salonId: string, customerId: string) {
  const deleted = await customerRepo.deleteProfile(customerId, salonId);
  if (!deleted) {
    throw new AppError('Customer not found', httpStatus.NOT_FOUND);
  }
  return deleted;
}
