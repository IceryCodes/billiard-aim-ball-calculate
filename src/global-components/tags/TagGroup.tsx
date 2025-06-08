import { FieldValues, UseFormSetValue } from 'react-hook-form';

import Tag from './Tag';

interface TagGroupProps {
  tags: string[];
  fieldName: string;
  setValue: UseFormSetValue<FieldValues>;
}

export const TagGroup = ({ tags, fieldName, setValue }: TagGroupProps) => {
  return (
    <div
      className="flex items-center gap-x-2 overflow-x-auto whitespace-nowrap scrollbar-thin py-2"
      style={{ maxWidth: '100%', scrollbarWidth: 'thin' }}
    >
      {tags.map(
        (tag: string, index: number) =>
          tag && (
            <div key={index} className="cursor-pointer">
              <Tag
                text={tag}
                onClick={() => {
                  setValue(
                    fieldName,
                    tags.filter((t) => t !== tag)
                  );
                }}
              />
            </div>
          )
      )}
    </div>
  );
};
