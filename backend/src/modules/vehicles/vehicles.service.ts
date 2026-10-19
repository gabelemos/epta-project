import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { conflict, notFound } from '../../lib/errors.js'
import type { VehicleInput } from './vehicles.schemas.js'

export async function listVehicles(userId: string, opts: { search?: string; page: number; pageSize: number }) {
  const where: Prisma.VehicleWhereInput = { userId }
  if (opts.search) {
    where.OR = ['plate', 'brand', 'model', 'color', 'chassis'].map((field) => ({
      [field]: { contains: opts.search, mode: 'insensitive' },
    })) as Prisma.VehicleWhereInput[]
  }

  const [items, total] = await prisma.$transaction([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
    prisma.vehicle.count({ where }),
  ])

  return { items, total, page: opts.page, pageSize: opts.pageSize }
}

export async function getVehicle(userId: string, id: string) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId } })
  if (!vehicle) throw notFound('Veículo')
  return vehicle
}

export async function createVehicle(userId: string, data: VehicleInput) {
  try {
    return await prisma.vehicle.create({ data: { ...data, userId } })
  } catch (error) {
    throw mapUniqueError(error)
  }
}

export async function updateVehicle(userId: string, id: string, data: VehicleInput) {
  await getVehicle(userId, id)
  try {
    return await prisma.vehicle.update({ where: { id }, data })
  } catch (error) {
    throw mapUniqueError(error)
  }
}

export async function deleteVehicle(userId: string, id: string) {
  await getVehicle(userId, id)
  await prisma.vehicle.delete({ where: { id } })
}

function mapUniqueError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return conflict('Você já possui um veículo com esta placa')
  }
  return error
}
