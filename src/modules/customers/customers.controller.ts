import { Request, Response, NextFunction } from 'express';
import * as customerService from './customers.service';
import { CreateCustomerInput, UpdateCustomerInput } from './customers.types';

export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonId } = req.params;
    const { search, page, limit } = req.query;

    const result = await customerService.listCustomers(salonId, {
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.ok(result);
  } catch (error) {
    next(error);
  }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonId, customerId } = req.params;
    const customer = await customerService.getCustomerDetail(salonId, customerId);

    res.ok(customer);
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonId } = req.params;
    const input: CreateCustomerInput = req.body;

    const customer = await customerService.createCustomer(salonId, input);

    res.created(customer);
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const { salonId, customerId } = req.params;
    const input: UpdateCustomerInput = req.body;

    const customer = await customerService.updateCustomer(salonId, customerId, input);

    res.ok(customer);
  } catch (error) {
    next(error);
  }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
        const { salonId, customerId } = req.params;
        await customerService.deleteCustomer(salonId, customerId);
        res.noContent();
    } catch (error) {
        next(error);
    }
}
