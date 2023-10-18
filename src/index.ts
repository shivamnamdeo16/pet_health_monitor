import {$query,$update,Record,StableBTreeMap,Vec,match,Result,nat64,ic,Opt,Principal,} from"azle";
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


  
  // Define a storage container for pets
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
      Some: (pet) => Result.Ok<Pet, string>(pet),
     
      None: () => Result.Err<Pet, string>(`Pet with id=${id} not found.`),
    });
  }
  
  // Retrieve all pets
  $query;
  export function getAllPets(): Result<Vec<Pet>, string> {
    
    
    return Result.Ok(petStorage.values());
  }
  
  


  $update;
  export function updatePet(id: string, payload: PetPayload): Result<Pet, string> {
    return match(petStorage.get(id), {
      Some: (existingPet) => {
        const updatedPet: Pet = {
          ...existingPet,
          ...payload,
          updatedAt: Opt.Some(ic.time()),
        };
  
        
        petStorage.insert(updatedPet.id, updatedPet);
        return Result.Ok<Pet, string>(updatedPet);
      },
     
     
      None: () => Result.Err<Pet, string>(`Pet with id=${id} not found.`),
    });
  }
  




  $update;
  export function deletePet(id: string): Result<Pet, string> {
    return match(petStorage.get(id), {
      Some: (existingPet) => {
        petStorage.remove(id);
        return Result.Ok<Pet, string>(existingPet);
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
  

  // Pet Health Monitor is a comprehensive web application designed to assist pet owners in caring for their furry companions' well-being. Our platform offers a user-friendly experience, allowing users to seamlessly perform CRUD (Create, Read, Update, Delete) operations on pet profiles, health records. Furthermore, Pet Health Monitor goes the extra mile by providing timely reminders for vaccinations and vet appointments, ensuring that your pets receive the best care possible.