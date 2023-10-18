// Import necessary modules
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt, Principal } from "azle";
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

// Define the payload for creating a new Pet record
type PetPayload = Record<{
  name: string;
  breed: string;
  age: number;
  weight: number;
  healthRecord: string;
  vaccination: boolean;
}>;

// Define a storage container for pets
const petStorage = new StableBTreeMap<string, Pet>(0, 44, 1024);

// Function to create a new Pet record
$update;
export function createPet(payload: PetPayload): Result<Pet, string> {
  if (!payload.name || !payload.breed || !payload.age || !payload.weight || !payload.healthRecord || !payload.vaccination) {
    // Validation: Check if required fields in the payload are missing
    return Result.Err<Pet, string>("Missing required fields in payload");
  }

  if (payload.age <= 0) {
    // Validation: Check if age is greater than zero
    return Result.Err<Pet, string>("Age must be greater than zero.");
  }

  if (payload.weight <= 0) {
    // Validation: Check if weight is greater than zero
    return Result.Err<Pet, string>("Weight must be greater than zero.");
  }

  // Create a new Pet object
  const pet: Pet = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    name: payload.name,
    breed: payload.breed,
    age: payload.age,
    weight: payload.weight,
    healthRecord: payload.healthRecord,
    vaccination: payload.vaccination,
    owner: ic.caller(),
  };

  try {
    // Insert the new Pet record into storage
    petStorage.insert(pet.id, pet);
  } catch (error) {
    return Result.Err<Pet, string>("Error occurred during pet insertion");
  }

  return Result.Ok<Pet, string>(pet);
}

// Function to retrieve a Pet by its ID
$query;
export function getPet(id: string): Result<Pet, string> {
  if (!id) {
    // Validation: Check if ID is invalid or missing
    return Result.Err<Pet, string>(`Invalid id=${id}.`);
  }
  try {
    return match(petStorage.get(id), {
      Some: (pet) => Result.Ok<Pet, string>(pet),
      None: () => Result.Err<Pet, string>(`Pet with id=${id} not found.`),
    });

  } catch (error) {
    return Result.Err<Pet, string>(`Error while retrieving pet with id ${id}`);
  }
}

// Function to retrieve all Pets
$query;
export function getAllPets(): Result<Vec<Pet>, string> {
  try {
    return Result.Ok(petStorage.values());
  } catch (error) {
    return Result.Err(`Failed to get all pets: ${error}`);
  }
}

// Function to update a Pet record
$update;
export function updatePet(id: string, payload: PetPayload): Result<Pet, string> {
  if (!id) {
    // Validation: Check if ID is invalid or missing
    return Result.Err<Pet, string>('Invalid id.');
  }

  if (!payload.name || !payload.breed || !payload.age || !payload.weight || !payload.healthRecord || !payload.vaccination) {
    // Validation: Check if required fields in the payload are missing
    return Result.Err<Pet, string>('Missing required fields in payload.');
  }

  return match(petStorage.get(id), {
    Some: (existingPet) => {
      // Create an updated Pet object
      const updatedPet: Pet = {
        id: existingPet.id,
        name: payload.name,
        breed: payload.breed,
        age: payload.age,
        weight: payload.weight,
        healthRecord: payload.healthRecord,
        vaccination: payload.vaccination,
        owner: existingPet.owner,
        createdAt: existingPet.createdAt,
        updatedAt: Opt.Some(ic.time()),
      };

      try {
        // Update the Pet record in storage
        petStorage.insert(updatedPet.id, updatedPet);
        return Result.Ok<Pet, string>(updatedPet);
      } catch (error) {
        return Result.Err<Pet, string>(`Error updating pet: ${error}`);
      }
    },

    None: () => Result.Err<Pet, string>(`Pet with id=${id} not found.`),
  });
}

// Function to delete a Pet by its ID
$update;
export function deletePet(id: string): Result<Pet, string> {
  if (!id) {
    // Validation: Check if ID is invalid or missing
    return Result.Err<Pet, string>(`Invalid id=${id}.`);
  }
  try {
    return match(petStorage.get(id), {
      Some: (existingPet) => {
        // Check if the caller is the owner of the Pet
        if (existingPet.owner.toString() === ic.caller.toString()) {
          return Result.Err<Pet, string>("User does not have the right to delete pet");
        }

        // Remove the Pet from storage
        petStorage.remove(id);
        return Result.Ok<Pet, string>(existingPet);
      },
      None: () => Result.Err<Pet, string>(`Pet with id=${id} not found.`),
    });
  } catch (error) {
    return Result.Err<Pet, string>(`Error deleting pet with id=${id}: ${error}`);
  }
}

// Set up a random number generator for generating UUIDs
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