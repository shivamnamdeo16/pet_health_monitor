import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
  Principal,
} from "azle";
import { v4 as uuidv4 } from "uuid";

// Define the Pet record structure
type Pet = Record<{
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  healthRecord: string;
  vaccination: boolean;
  owner: Principal;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type PetPayload = Record<{
  name: string;
  breed: string;
  age: number;
  weight: number;
  healthRecord: string;
  vaccination: boolean;
}>;

const petStorage = new StableBTreeMap<string, Pet>(0, 44, 1024);

// Create a new pet and store it in the database
$update;
export function createPet(payload: PetPayload): Result<Pet, string> {
  const pet: Pet = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    ...payload,
    owner: ic.caller(),
  };

  petStorage.insert(pet.id, pet);
  return Result.Ok<Pet, string>(pet);
}

// Retrieve a pet by its ID
$query;
export function getPet(id: string): Result<Pet, string> {
  return match(petStorage.get(id), {
    Some: (pet: any) => Result.Ok<Pet, string>(pet),
    None: () => Result.Err<Pet, string>(`Pet with id=${id} not found.`),
  });
}

// Retrieve all pets
$query;
export function getAllPets(): Result<Vec<Pet>, string> {
  return Result.Ok(petStorage.values());
}

// Update a pet's vaccination status
$update;
export function updateVaccinationStatus(id: string, status: boolean): Result<Pet, string> {
  return match(petStorage.get(id), {
    Some: (existingPet: any) => {
      const updatedPet: Pet = {
        ...existingPet,
        vaccination: status,
        updatedAt: Opt.Some(ic.time()),
      };

      petStorage.insert(updatedPet.id, updatedPet);
      return Result.Ok<Pet, string>(updatedPet);
    },
    None: () => Result.Err<Pet, string>(`Pet with id=${id} not found.`),
  });
}

// Retrieve pets by owner
$query;
export function getPetsByOwner(owner: Principal): Result<Vec<Pet>, string> {
  const pets = petStorage.values().filter((pet: { owner: any; }) => pet.owner === owner);
  return Result.Ok<Vec<Pet>, string>(pets);
}

// Get the number of pets in the database
$query;
export function getNumberOfPets(): Result<number, string> {
  return Result.Ok(petStorage.size());
}

// Delete all pets owned by a user
$update;
export function deletePetsByOwner(owner: Principal): Result<Vec<Pet>, string> {
  const deletedPets: Pet[] = [];
  const keysToDelete: string[] = [];
  petStorage.forEach((pet: { owner: any; }, key: string) => {
    if (pet.owner === owner) {
      keysToDelete.push(key);
      deletedPets.push(pet);
    }
  });

  keysToDelete.forEach((key) => petStorage.remove(key));
  return Result.Ok<Vec<Pet>, string>(deletedPets);
}

// Calculate the average age of all pets
$query;
export function getAverageAgeOfPets(): Result<number, string> {
  const pets = petStorage.values();
  const totalAge = pets.reduce((sum: any, pet: { age: any; }) => sum + pet.age, 0);
  return Result.Ok(totalAge / pets.length);
}

// Retrieve pets with a specific breed
$query;
export function getPetsByBreed(breed: string): Result<Vec<Pet>, string> {
  const pets = petStorage.values().filter((pet: { breed: string; }) => pet.breed === breed);
  return Result.Ok<Vec<Pet>, string>(pets);
}

// Search pets by name
$query;
export function searchPetsByName(name: string): Result<Vec<Pet>, string> {
  const pets = petStorage.values().filter((pet: { name: string; }) => pet.name.toLowerCase().includes(name.toLowerCase()));
  return Result.Ok<Vec<Pet>, string>(pets);
}

// Update the weight of a pet
$update;
export function updatePetWeight(id: string, weight: number): Result<Pet, string> {
  return match(petStorage.get(id), {
    Some: (existingPet: any) => {
      const updatedPet: Pet = {
        ...existingPet,
        weight: weight,
        updatedAt: Opt.Some(ic.time()),
      };

      petStorage.insert(updatedPet.id, updatedPet);
      return Result.Ok<Pet, string>(updatedPet);
    },
    None: () => Result.Err<Pet, string>(`Pet with id=${id} not found.`),
  });
}

// Add a new health record for a pet
$update;
export function addHealthRecord(id: string, record: string): Result<Pet, string> {
  return match(petStorage.get(id), {
    Some: (existingPet: { healthRecord: string; }) => {
      const updatedPet: Pet = {
        ...existingPet,
        healthRecord: existingPet.healthRecord + "\n" + record,
        updatedAt: Opt.Some(ic.time()),
      };

      petStorage.insert(updatedPet.id, updatedPet);
      return Result.Ok<Pet, string>(updatedPet);
    },
    None: () => Result.Err<Pet, string>(`Pet with id=${id} not found.`),
  });
}

globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};

// Pet Health Monitor is a comprehensive web application designed to assist pet owners in caring for their furry companions' well-being.
// Our platform offers a user-friendly experience, allowing users to seamlessly perform CRUD (Create, Read, Update, Delete) operations on pet profiles, health records.
// Furthermore, Pet Health Monitor goes the extra mile by providing timely reminders for vaccinations and vet appointments, ensuring that your pets receive the best care possible.
