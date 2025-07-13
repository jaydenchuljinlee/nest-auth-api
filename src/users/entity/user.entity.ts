import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToMany(() => Role, (role) => role.users, { eager: true }) // eager: 자동 로딩
  @JoinTable({
    name: 'user_roles',
    joinColumn: {
      name: 'user_id',               // user_roles 테이블 내 유저 FK 컬럼명
      referencedColumnName: 'id',    // users 테이블 PK 컬럼명
    },
    inverseJoinColumn: {
      name: 'role_id',               // user_roles 테이블 내 역할 FK 컬럼명
      referencedColumnName: 'id',    // roles 테이블 PK 컬럼명
    },
  })
  //@JoinTable({ name: 'user_roles' }) // 중간 테이블 이름 지정
  roles: Role[];
}
